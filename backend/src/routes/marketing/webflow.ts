import { desc, eq } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import { webflowBlogItem } from "../../db/schema";
import {
  getMarketingEnv,
  isMarketingIntegrationConfigured,
} from "../../lib/marketing/marketing-env";
import { guardMarketing } from "../../lib/marketing/marketing-http";
import {
  publishWebflowItem,
  pullWebflowBlogItems,
} from "../../lib/marketing/webflow-client";
import type { AppVariables } from "../../types/app";

export function registerMarketingWebflowRoutes(
  app: HonoType<{ Variables: AppVariables }>,
) {
  const r = new Hono<{ Variables: AppVariables }>();

  r.get("/webflow/status", async (c) => {
    const deny = guardMarketing(c, "marketing.read");
    if (deny) return deny;

    const env = getMarketingEnv();
    return c.json({
      configured: isMarketingIntegrationConfigured("webflow"),
      siteId: env.webflowSiteId || null,
    });
  });

  r.get("/webflow/blog", async (c) => {
    const deny = guardMarketing(c, "marketing.read");
    if (deny) return deny;

    const env = getMarketingEnv();
    const rows = await db
      .select()
      .from(webflowBlogItem)
      .where(eq(webflowBlogItem.siteId, env.webflowSiteId || "__none__"))
      .orderBy(desc(webflowBlogItem.updatedAt));

    return c.json({ items: rows });
  });

  r.post("/webflow/blog/sync", async (c) => {
    const deny = guardMarketing(c, "marketing.write");
    if (deny) return deny;

    const env = getMarketingEnv();
    if (!env.webflowSiteId)
      return c.json({ error: "WEBFLOW_SITE_ID manquant" }, 400);

    try {
      const result = await pullWebflowBlogItems(env.webflowSiteId);
      return c.json(result);
    } catch (e) {
      return c.json(
        { error: e instanceof Error ? e.message : "sync_failed" },
        400,
      );
    }
  });

  r.post("/webflow/blog", async (c) => {
    const deny = guardMarketing(c, "marketing.write");
    if (deny) return deny;

    const body = await c.req.json<{
      title?: string;
      slug?: string;
      summary?: string;
      body?: string;
      author?: string;
    }>();

    if (!body.title?.trim() || !body.slug?.trim()) {
      return c.json({ error: "title et slug requis" }, 400);
    }

    const env = getMarketingEnv();
    const user = c.get("user");
    const id = Bun.randomUUIDv7();
    const slug = body.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");

    await db.insert(webflowBlogItem).values({
      id,
      siteId: env.webflowSiteId || "local",
      slug,
      title: body.title.trim(),
      summary: body.summary?.trim() ?? null,
      body: body.body ?? "",
      author: body.author?.trim() ?? null,
      status: "draft",
      isDraft: true,
      createdBy: user?.id ?? null,
    });

    return c.json({ id }, 201);
  });

  r.patch("/webflow/blog/:id", async (c) => {
    const deny = guardMarketing(c, "marketing.write");
    if (deny) return deny;

    const id = c.req.param("id");
    const body = await c.req.json<Record<string, unknown>>();

    const [existing] = await db
      .select()
      .from(webflowBlogItem)
      .where(eq(webflowBlogItem.id, id))
      .limit(1);
    if (!existing) return c.json({ error: "not_found" }, 404);

    await db
      .update(webflowBlogItem)
      .set({
        title: typeof body.title === "string" ? body.title : existing.title,
        slug: typeof body.slug === "string" ? body.slug : existing.slug,
        summary:
          typeof body.summary === "string" ? body.summary : existing.summary,
        body: typeof body.body === "string" ? body.body : existing.body,
        author: typeof body.author === "string" ? body.author : existing.author,
        metaTitle:
          typeof body.metaTitle === "string"
            ? body.metaTitle
            : existing.metaTitle,
        metaDescription:
          typeof body.metaDescription === "string"
            ? body.metaDescription
            : existing.metaDescription,
        categories:
          typeof body.categories === "string"
            ? body.categories
            : existing.categories,
        imageUrl:
          typeof body.imageUrl === "string" ? body.imageUrl : existing.imageUrl,
      })
      .where(eq(webflowBlogItem.id, id));

    return c.json({ ok: true });
  });

  r.post("/webflow/blog/:id/publish", async (c) => {
    const deny = guardMarketing(c, "marketing.write");
    if (deny) return deny;

    const env = getMarketingEnv();
    if (!env.webflowSiteId)
      return c.json({ error: "WEBFLOW_SITE_ID manquant" }, 400);

    try {
      await publishWebflowItem(env.webflowSiteId, c.req.param("id"));
      return c.json({ ok: true });
    } catch (e) {
      return c.json(
        { error: e instanceof Error ? e.message : "publish_failed" },
        400,
      );
    }
  });

  app.route("/api/app/marketing", r);
}
