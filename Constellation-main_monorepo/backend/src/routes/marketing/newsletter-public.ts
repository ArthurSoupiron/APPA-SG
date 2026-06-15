import { and, eq, gt, isNull } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../../db";
import {
  newsletterBlock,
  newsletterCampaign,
  newsletterConfirmToken,
  newsletterConsentLog,
  newsletterEvent,
  newsletterSubscriber,
  newsletterSubscriberTag,
  newsletterTag,
} from "../../db/schema";
import { getMarketingEnv } from "../../lib/marketing/marketing-env";
import { hashIp, newToken } from "../../lib/marketing/marketing-http";
import { defaultFooterHtml, renderBlocksToHtml } from "../../lib/marketing/newsletter-render";

export function registerMarketingNewsletterPublicRoutes(app: Hono) {
  const r = new Hono();

  r.post("/newsletter/subscribe", async (c) => {
    const body = await c.req.json<{
      email?: string;
      firstName?: string;
      lastName?: string;
      tagSlugs?: string[];
      consentText?: string;
      source?: string;
    }>();

    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) return c.json({ error: "email invalide" }, 400);

    const consentText =
      body.consentText?.trim() ||
      "J'accepte de recevoir la newsletter et j'ai pris connaissance de la politique de confidentialité.";
    const source = body.source?.trim() || "web_form";

    const [existing] = await db
      .select()
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.email, email))
      .limit(1);

    let subscriberId = existing?.id;
    if (!existing) {
      subscriberId = Bun.randomUUIDv7();
      await db.insert(newsletterSubscriber).values({
        id: subscriberId,
        email,
        status: "pending",
        firstName: body.firstName?.trim() ?? null,
        lastName: body.lastName?.trim() ?? null,
        unsubscribeToken: newToken(),
      });
    } else if (existing.status === "active") {
      return c.json({ ok: true, message: "already_subscribed" });
    }

    if (!subscriberId) return c.json({ error: "internal" }, 500);

    const confirmToken = newToken();
    await db.insert(newsletterConfirmToken).values({
      id: Bun.randomUUIDv7(),
      subscriberId,
      token: confirmToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    await db.insert(newsletterConsentLog).values({
      id: Bun.randomUUIDv7(),
      subscriberId,
      mode: "double_optin_pending",
      source,
      consentText,
      legalBasis: "consent",
      ipHash: hashIp(ip),
      userAgent: c.req.header("user-agent") ?? null,
    });

    if (body.tagSlugs?.length) {
      const tags = await db.select().from(newsletterTag);
      for (const slug of body.tagSlugs) {
        const tag = tags.find((t) => t.slug === slug);
        if (tag) {
          await db
            .insert(newsletterSubscriberTag)
            .values({ subscriberId, tagId: tag.id })
            .onConflictDoNothing();
        }
      }
    }

    const env = getMarketingEnv();
    const confirmUrl = `${env.newsletterPublicBaseUrl.replace(/\/$/, "")}/newsletter/confirmation/${confirmToken}`;

    return c.json({
      ok: true,
      message: "confirmation_required",
      confirmUrl,
    });
  });

  r.get("/newsletter/confirm/:token", async (c) => {
    const token = c.req.param("token");
    const [row] = await db
      .select()
      .from(newsletterConfirmToken)
      .where(
        and(
          eq(newsletterConfirmToken.token, token),
          isNull(newsletterConfirmToken.usedAt),
          gt(newsletterConfirmToken.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row) return c.json({ error: "invalid_token" }, 400);

    await db
      .update(newsletterConfirmToken)
      .set({ usedAt: new Date() })
      .where(eq(newsletterConfirmToken.id, row.id));

    await db
      .update(newsletterSubscriber)
      .set({ status: "active" })
      .where(eq(newsletterSubscriber.id, row.subscriberId));

    await db.insert(newsletterConsentLog).values({
      id: Bun.randomUUIDv7(),
      subscriberId: row.subscriberId,
      mode: "double_optin_confirmed",
      source: "email_confirm",
      consentText: "Confirmation double opt-in",
      legalBasis: "consent",
    });

    return c.json({ ok: true });
  });

  r.get("/newsletter/unsubscribe/:token", async (c) => {
    const token = c.req.param("token");
    const [sub] = await db
      .select()
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.unsubscribeToken, token))
      .limit(1);
    if (!sub) return c.json({ error: "not_found" }, 404);

    const tags = await db
      .select({ tag: newsletterTag, link: newsletterSubscriberTag })
      .from(newsletterSubscriberTag)
      .innerJoin(newsletterTag, eq(newsletterSubscriberTag.tagId, newsletterTag.id))
      .where(eq(newsletterSubscriberTag.subscriberId, sub.id));

    return c.json({
      email: sub.email,
      tags: tags.map((t) => ({
        id: t.tag.id,
        slug: t.tag.slug,
        label: t.tag.label,
        unsubscribedAt: t.link.unsubscribedAt,
      })),
    });
  });

  r.post("/newsletter/unsubscribe/:token", async (c) => {
    const token = c.req.param("token");
    const body = await c.req.json<{ global?: boolean; tagIds?: string[] }>();

    const [sub] = await db
      .select()
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.unsubscribeToken, token))
      .limit(1);
    if (!sub) return c.json({ error: "not_found" }, 404);

    if (body.global) {
      await db
        .update(newsletterSubscriber)
        .set({ status: "unsubscribed", globalUnsubscribedAt: new Date() })
        .where(eq(newsletterSubscriber.id, sub.id));
    }

    if (body.tagIds?.length) {
      for (const tagId of body.tagIds) {
        await db
          .update(newsletterSubscriberTag)
          .set({ unsubscribedAt: new Date() })
          .where(
            and(
              eq(newsletterSubscriberTag.subscriberId, sub.id),
              eq(newsletterSubscriberTag.tagId, tagId),
            ),
          );
      }
    }

    return c.json({ ok: true });
  });

  r.get("/newsletter/campaigns/view/:token", async (c) => {
    const token = c.req.param("token");
    const [campaign] = await db
      .select()
      .from(newsletterCampaign)
      .where(eq(newsletterCampaign.publicViewToken, token))
      .limit(1);
    if (!campaign) return c.json({ error: "not_found" }, 404);

    const blocks = await db
      .select()
      .from(newsletterBlock)
      .where(eq(newsletterBlock.campaignId, campaign.id))
      .orderBy(newsletterBlock.sortOrder);

    const env = getMarketingEnv();
    const html = renderBlocksToHtml(
      blocks.map((b) => ({
        blockType: b.blockType,
        content: b.content as Record<string, unknown>,
        trackId: b.trackId,
        sortOrder: b.sortOrder,
      })),
      { campaignId: campaign.id, baseUrl: env.newsletterPublicBaseUrl },
    );

    return c.html(`${html}${campaign.footerHtml ?? ""}`);
  });

  r.get("/newsletter/open", async (c) => {
    const campaignId = c.req.query("c") ?? "";
    const subscriberId = c.req.query("s") ?? "";
    if (campaignId) {
      await db.insert(newsletterEvent).values({
        id: Bun.randomUUIDv7(),
        campaignId,
        subscriberId: subscriberId || null,
        eventType: "open",
        ipHash: hashIp(c.req.header("x-forwarded-for")?.split(",")[0]),
        userAgent: c.req.header("user-agent") ?? null,
      });
    }
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    return new Response(pixel, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  });

  r.get("/newsletter/click", async (c) => {
    const campaignId = c.req.query("c") ?? "";
    const trackId = c.req.query("t") ?? "";
    const url = c.req.query("u") ?? "/";
    const subscriberId = c.req.query("s") ?? "";

    if (campaignId && trackId) {
      await db.insert(newsletterEvent).values({
        id: Bun.randomUUIDv7(),
        campaignId,
        subscriberId: subscriberId || null,
        eventType: "click",
        blockTrackId: trackId,
        linkUrl: url,
        ipHash: hashIp(c.req.header("x-forwarded-for")?.split(",")[0]),
        userAgent: c.req.header("user-agent") ?? null,
      });
    }

    return c.redirect(url.startsWith("http") ? url : `https://${url}`, 302);
  });

  app.route("/api/public", r);
}
