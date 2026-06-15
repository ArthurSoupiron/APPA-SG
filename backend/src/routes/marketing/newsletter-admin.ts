import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import {
  newsletterBlock,
  newsletterCampaign,
  newsletterCampaignList,
  newsletterCampaignTag,
  newsletterConsentLog,
  newsletterEvent,
  newsletterList,
  newsletterListSubscriber,
  newsletterSend,
  newsletterSendQueue,
  newsletterSubscriber,
  newsletterSubscriberTag,
  newsletterTag,
} from "../../db/schema";
import { getMarketingEnv } from "../../lib/marketing/marketing-env";
import { guardMarketing, newToken } from "../../lib/marketing/marketing-http";
import {
  defaultFooterHtml,
  injectOpenPixel,
  renderBlocksToHtml,
} from "../../lib/marketing/newsletter-render";
import { sendSmtpMail } from "../../lib/marketing/smtp-send";
import type { AppVariables } from "../../types/app";

export function registerMarketingNewsletterAdminRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const r = new Hono<{ Variables: AppVariables }>();

  r.get("/newsletter/dashboard", async (c) => {
    const deny = guardMarketing(c, "marketing.read");
    if (deny) return deny;

    const [subs] = await db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscriber);
    const [active] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.status, "active"));
    const [campaigns] = await db.select({ count: sql<number>`count(*)::int` }).from(newsletterCampaign);

    return c.json({
      subscribers: subs?.count ?? 0,
      activeSubscribers: active?.count ?? 0,
      campaigns: campaigns?.count ?? 0,
    });
  });

  r.get("/newsletter/subscribers", async (c) => {
    const deny = guardMarketing(c, "marketing.read");
    if (deny) return deny;

    const rows = await db
      .select()
      .from(newsletterSubscriber)
      .orderBy(desc(newsletterSubscriber.createdAt))
      .limit(200);
    return c.json({ items: rows });
  });

  r.get("/newsletter/tags", async (c) => {
    const deny = guardMarketing(c, "marketing.read");
    if (deny) return deny;
    const rows = await db.select().from(newsletterTag).orderBy(newsletterTag.label);
    return c.json({ items: rows });
  });

  r.post("/newsletter/tags", async (c) => {
    const deny = guardMarketing(c, "marketing.write");
    if (deny) return deny;
    const body = await c.req.json<{ slug?: string; label?: string; legalBasis?: string }>();
    if (!body.slug?.trim() || !body.label?.trim()) {
      return c.json({ error: "slug et label requis" }, 400);
    }
    const id = Bun.randomUUIDv7();
    await db.insert(newsletterTag).values({
      id,
      slug: body.slug.trim(),
      label: body.label.trim(),
      legalBasis: (body.legalBasis as "consent") ?? "consent",
    });
    return c.json({ id }, 201);
  });

  r.get("/newsletter/lists", async (c) => {
    const deny = guardMarketing(c, "marketing.read");
    if (deny) return deny;
    const rows = await db.select().from(newsletterList).orderBy(newsletterList.name);
    return c.json({ items: rows });
  });

  r.post("/newsletter/lists", async (c) => {
    const deny = guardMarketing(c, "marketing.write");
    if (deny) return deny;
    const body = await c.req.json<{ name?: string; description?: string }>();
    if (!body.name?.trim()) return c.json({ error: "name requis" }, 400);
    const id = Bun.randomUUIDv7();
    await db.insert(newsletterList).values({
      id,
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
    });
    return c.json({ id }, 201);
  });

  r.post("/newsletter/subscribers/import", async (c) => {
    const deny = guardMarketing(c, "marketing.write");
    if (deny) return deny;

    const body = await c.req.json<{
      rows?: {
        email: string;
        consent_date: string;
        source: string;
        consent_text: string;
        tagSlugs?: string[];
        firstName?: string;
        lastName?: string;
      }[];
    }>();

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return c.json({ error: "rows requis" }, 400);
    }

    let imported = 0;
    for (const row of body.rows) {
      if (!row.email?.trim() || !row.consent_date || !row.source || !row.consent_text) continue;

      const email = row.email.trim().toLowerCase();
      const [existing] = await db
        .select()
        .from(newsletterSubscriber)
        .where(eq(newsletterSubscriber.email, email))
        .limit(1);

      let subId = existing?.id;
      if (!existing) {
        subId = Bun.randomUUIDv7();
        await db.insert(newsletterSubscriber).values({
          id: subId,
          email,
          status: "active",
          firstName: row.firstName?.trim() ?? null,
          lastName: row.lastName?.trim() ?? null,
          unsubscribeToken: newToken(),
        });
        imported++;
      } else if (existing.status !== "active") {
        await db
          .update(newsletterSubscriber)
          .set({ status: "active", globalUnsubscribedAt: null })
          .where(eq(newsletterSubscriber.id, existing.id));
      }

      if (!subId) continue;

      await db.insert(newsletterConsentLog).values({
        id: Bun.randomUUIDv7(),
        subscriberId: subId,
        mode: "single_optin",
        source: row.source,
        consentText: row.consent_text,
        legalBasis: "consent",
        recordedAt: new Date(row.consent_date),
      });

      if (row.tagSlugs?.length) {
        const tags = await db
          .select()
          .from(newsletterTag)
          .where(inArray(newsletterTag.slug, row.tagSlugs));
        for (const tag of tags) {
          await db
            .insert(newsletterSubscriberTag)
            .values({ subscriberId: subId, tagId: tag.id })
            .onConflictDoNothing();
        }
      }
    }

    return c.json({ imported });
  });

  r.get("/newsletter/campaigns", async (c) => {
    const deny = guardMarketing(c, "marketing.read");
    if (deny) return deny;
    const rows = await db
      .select()
      .from(newsletterCampaign)
      .orderBy(desc(newsletterCampaign.updatedAt));
    return c.json({ items: rows });
  });

  r.get("/newsletter/campaigns/:id", async (c) => {
    const deny = guardMarketing(c, "marketing.read");
    if (deny) return deny;

    const id = c.req.param("id");
    const [campaign] = await db
      .select()
      .from(newsletterCampaign)
      .where(eq(newsletterCampaign.id, id))
      .limit(1);
    if (!campaign) return c.json({ error: "not_found" }, 404);

    const blocks = await db
      .select()
      .from(newsletterBlock)
      .where(eq(newsletterBlock.campaignId, id))
      .orderBy(newsletterBlock.sortOrder);

    const tagRows = await db
      .select({ tag: newsletterTag })
      .from(newsletterCampaignTag)
      .innerJoin(newsletterTag, eq(newsletterCampaignTag.tagId, newsletterTag.id))
      .where(eq(newsletterCampaignTag.campaignId, id));

    const listRows = await db
      .select({ list: newsletterList })
      .from(newsletterCampaignList)
      .innerJoin(newsletterList, eq(newsletterCampaignList.listId, newsletterList.id))
      .where(eq(newsletterCampaignList.campaignId, id));

    const [openCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsletterEvent)
      .where(and(eq(newsletterEvent.campaignId, id), eq(newsletterEvent.eventType, "open")));

    const [clickCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsletterEvent)
      .where(and(eq(newsletterEvent.campaignId, id), eq(newsletterEvent.eventType, "click")));

    const blockStats = await db
      .select({
        blockTrackId: newsletterEvent.blockTrackId,
        count: sql<number>`count(*)::int`,
      })
      .from(newsletterEvent)
      .where(and(eq(newsletterEvent.campaignId, id), eq(newsletterEvent.eventType, "click")))
      .groupBy(newsletterEvent.blockTrackId);

    return c.json({
      campaign,
      blocks,
      tags: tagRows.map((r) => r.tag),
      lists: listRows.map((r) => r.list),
      stats: {
        opens: openCount?.count ?? 0,
        clicks: clickCount?.count ?? 0,
        blockClicks: blockStats,
      },
    });
  });

  r.post("/newsletter/campaigns", async (c) => {
    const deny = guardMarketing(c, "marketing.write");
    if (deny) return deny;

    const body = await c.req.json<{
      name?: string;
      subject?: string;
      preheader?: string;
      templateKey?: string;
      blocks?: { blockType: string; content: Record<string, unknown>; trackId?: string }[];
      tagIds?: string[];
      listIds?: string[];
    }>();

    if (!body.name?.trim() || !body.subject?.trim()) {
      return c.json({ error: "name et subject requis" }, 400);
    }

    const user = c.get("user");
    const id = Bun.randomUUIDv7();
    await db.insert(newsletterCampaign).values({
      id,
      name: body.name.trim(),
      subject: body.subject.trim(),
      preheader: body.preheader?.trim() ?? null,
      templateKey: body.templateKey ?? null,
      publicViewToken: newToken(),
      createdBy: user?.id ?? null,
    });

    const blocks = body.blocks ?? [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (!b) continue;
      await db.insert(newsletterBlock).values({
        id: Bun.randomUUIDv7(),
        campaignId: id,
        sortOrder: i,
        blockType: b.blockType,
        content: b.content,
        trackId: b.trackId ?? `block-${i}`,
      });
    }

    for (const tagId of body.tagIds ?? []) {
      await db.insert(newsletterCampaignTag).values({ campaignId: id, tagId }).onConflictDoNothing();
    }
    for (const listId of body.listIds ?? []) {
      await db.insert(newsletterCampaignList).values({ campaignId: id, listId }).onConflictDoNothing();
    }

    return c.json({ id }, 201);
  });

  r.post("/newsletter/campaigns/:id/send", async (c) => {
    const deny = guardMarketing(c, "marketing.write");
    if (deny) return deny;

    const campaignId = c.req.param("id");
    const body: { testEmails?: string[] } = await c.req
      .json<{ testEmails?: string[] }>()
      .catch(() => ({ testEmails: undefined }));

    const [campaign] = await db
      .select()
      .from(newsletterCampaign)
      .where(eq(newsletterCampaign.id, campaignId))
      .limit(1);
    if (!campaign) return c.json({ error: "not_found" }, 404);

    const blocks = await db
      .select()
      .from(newsletterBlock)
      .where(eq(newsletterBlock.campaignId, campaignId))
      .orderBy(newsletterBlock.sortOrder);

    const env = getMarketingEnv();
    const baseUrl = env.newsletterPublicBaseUrl.replace(/\/$/, "");

    let recipients: { id: string; email: string; unsubscribeToken: string }[] = [];

    if (body.testEmails?.length) {
      recipients = body.testEmails.map((email) => ({
        id: "test",
        email,
        unsubscribeToken: "test",
      }));
    } else {
      const listLinks = await db
        .select()
        .from(newsletterCampaignList)
        .where(eq(newsletterCampaignList.campaignId, campaignId));
      const listIds = listLinks.map((l) => l.listId);

      if (listIds.length > 0) {
        const subs = await db
          .select({
            id: newsletterSubscriber.id,
            email: newsletterSubscriber.email,
            unsubscribeToken: newsletterSubscriber.unsubscribeToken,
          })
          .from(newsletterListSubscriber)
          .innerJoin(
            newsletterSubscriber,
            eq(newsletterListSubscriber.subscriberId, newsletterSubscriber.id),
          )
          .where(
            and(
              inArray(newsletterListSubscriber.listId, listIds),
              eq(newsletterSubscriber.status, "active"),
            ),
          );
        recipients = subs;
      }

      const tagLinks = await db
        .select()
        .from(newsletterCampaignTag)
        .where(eq(newsletterCampaignTag.campaignId, campaignId));
      const tagIds = tagLinks.map((t) => t.tagId);
      if (tagIds.length > 0) {
        const tagSubs = await db
          .select({
            id: newsletterSubscriber.id,
            email: newsletterSubscriber.email,
            unsubscribeToken: newsletterSubscriber.unsubscribeToken,
          })
          .from(newsletterSubscriberTag)
          .innerJoin(
            newsletterSubscriber,
            eq(newsletterSubscriberTag.subscriberId, newsletterSubscriber.id),
          )
          .where(
            and(
              inArray(newsletterSubscriberTag.tagId, tagIds),
              eq(newsletterSubscriber.status, "active"),
            ),
          );
        const seen = new Set(recipients.map((r) => r.id));
        for (const s of tagSubs) {
          if (!seen.has(s.id)) recipients.push(s);
        }
      }

      await db
        .update(newsletterCampaign)
        .set({ status: "sending" })
        .where(eq(newsletterCampaign.id, campaignId));
    }

    let sent = 0;
    let failed = 0;

    for (const sub of recipients) {
      const unsubUrl = `${baseUrl}/newsletter/desabonnement/${sub.unsubscribeToken}`;
      const htmlBody = renderBlocksToHtml(
        blocks.map((b) => ({
          blockType: b.blockType,
          content: b.content as Record<string, unknown>,
          trackId: b.trackId,
          sortOrder: b.sortOrder,
        })),
        {
          campaignId,
          subscriberId: sub.id === "test" ? undefined : sub.id,
          baseUrl,
        },
      );
      const footer = campaign.footerHtml ?? defaultFooterHtml(unsubUrl);
      const pixelUrl = `${baseUrl}/api/public/newsletter/open?c=${campaignId}&s=${sub.id}`;
      const html = injectOpenPixel(`${htmlBody}${footer}`, pixelUrl);

      const result = await sendSmtpMail({
        to: sub.email,
        subject: campaign.subject,
        html,
      });

      if (result.ok) {
        sent++;
        if (sub.id !== "test") {
          await db.insert(newsletterSend).values({
            id: Bun.randomUUIDv7(),
            campaignId,
            subscriberId: sub.id,
            messageId: result.messageId,
          });
        }
      } else {
        failed++;
      }
    }

    if (!body.testEmails?.length) {
      await db
        .update(newsletterCampaign)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(newsletterCampaign.id, campaignId));
    }

    return c.json({ sent, failed, total: recipients.length });
  });

  r.get("/newsletter/consent-export", async (c) => {
    const deny = guardMarketing(c, "marketing.read");
    if (deny) return deny;

    const rows = await db
      .select({
        email: newsletterSubscriber.email,
        mode: newsletterConsentLog.mode,
        source: newsletterConsentLog.source,
        consentText: newsletterConsentLog.consentText,
        legalBasis: newsletterConsentLog.legalBasis,
        recordedAt: newsletterConsentLog.recordedAt,
      })
      .from(newsletterConsentLog)
      .innerJoin(newsletterSubscriber, eq(newsletterConsentLog.subscriberId, newsletterSubscriber.id))
      .orderBy(desc(newsletterConsentLog.recordedAt));

    const header = "email,mode,source,consent_text,legal_basis,recorded_at\n";
    const lines = rows.map(
      (r) =>
        `"${r.email}","${r.mode}","${r.source}","${r.consentText.replace(/"/g, '""')}","${r.legalBasis ?? ""}","${r.recordedAt.toISOString()}"`,
    );
    return new Response(header + lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="consentements.csv"',
      },
    });
  });

  r.delete("/newsletter/campaigns/:id", async (c) => {
    const deny = guardMarketing(c, "marketing.delete");
    if (deny) return deny;
    await db.delete(newsletterCampaign).where(eq(newsletterCampaign.id, c.req.param("id")));
    return c.json({ ok: true });
  });

  app.route("/api/app/marketing", r);
}
