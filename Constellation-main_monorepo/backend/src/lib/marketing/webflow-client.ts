import { eq } from "drizzle-orm";

import { db } from "../../db";
import { webflowBlogItem, webflowSyncState } from "../../db/schema";
import { getMarketingEnv, isMarketingIntegrationConfigured } from "./marketing-env";

const WEBFLOW_API = "https://api.webflow.com/v2";

async function webflowFetch(path: string, init?: RequestInit) {
  const env = getMarketingEnv();
  const res = await fetch(`${WEBFLOW_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.webflowApiToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Webflow API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function ensureBlogCollection(siteId: string) {
  const env = getMarketingEnv();
  const [state] = await db
    .select()
    .from(webflowSyncState)
    .where(eq(webflowSyncState.siteId, siteId))
    .limit(1);

  if (state?.collectionId) return state;

  const collections = (await webflowFetch(`/sites/${siteId}/collections`)) as {
    collections?: { id: string; slug: string }[];
  };
  let collection = collections.collections?.find((c) => c.slug === env.webflowBlogCollectionSlug);

  if (!collection) {
    const created = (await webflowFetch(`/sites/${siteId}/collections`, {
      method: "POST",
      body: JSON.stringify({
        displayName: "Blog",
        singularName: "Article",
        slug: env.webflowBlogCollectionSlug,
      }),
    })) as { id: string; slug: string };
    collection = { id: created.id, slug: created.slug ?? env.webflowBlogCollectionSlug };
  }

  const id = state?.id ?? Bun.randomUUIDv7();
  if (state) {
    await db
      .update(webflowSyncState)
      .set({
        collectionId: collection.id,
        collectionSlug: collection.slug,
        lastSyncedAt: new Date(),
      })
      .where(eq(webflowSyncState.id, state.id));
  } else {
    await db.insert(webflowSyncState).values({
      id,
      siteId,
      collectionId: collection.id,
      collectionSlug: collection.slug,
      lastSyncedAt: new Date(),
    });
  }

  return { collectionId: collection.id, collectionSlug: collection.slug };
}

export async function pullWebflowBlogItems(siteId: string) {
  if (!isMarketingIntegrationConfigured("webflow")) {
    throw new Error("Webflow non configuré.");
  }
  const { collectionId } = await ensureBlogCollection(siteId);
  const data = (await webflowFetch(`/collections/${collectionId}/items`)) as {
    items?: { id: string; fieldData: Record<string, unknown>; isDraft?: boolean }[];
  };

  const now = new Date();
  for (const item of data.items ?? []) {
    const fd = item.fieldData ?? {};
    const slug = String(fd.slug ?? fd.name ?? item.id)
      .toLowerCase()
      .replace(/\s+/g, "-");
    const title = String(fd.name ?? fd.title ?? "Sans titre");
    const [existing] = await db
      .select()
      .from(webflowBlogItem)
      .where(eq(webflowBlogItem.webflowItemId, item.id))
      .limit(1);

    const row = {
      siteId,
      webflowItemId: item.id,
      slug,
      title,
      summary: fd["post-summary"] ? String(fd["post-summary"]) : null,
      body: fd["post-body"] ? String(fd["post-body"]) : "",
      author: fd.author ? String(fd.author) : null,
      imageUrl: fd["main-image"] ? String(fd["main-image"]) : null,
      metaTitle: fd["meta-title"] ? String(fd["meta-title"]) : null,
      metaDescription: fd["meta-description"] ? String(fd["meta-description"]) : null,
      categories: fd.categories ? String(fd.categories) : null,
      status: item.isDraft ? ("draft" as const) : ("published" as const),
      isDraft: Boolean(item.isDraft),
      fieldData: fd,
      lastSyncedAt: now,
      updatedAt: now,
    };

    if (existing) {
      await db.update(webflowBlogItem).set(row).where(eq(webflowBlogItem.id, existing.id));
    } else {
      await db.insert(webflowBlogItem).values({
        id: Bun.randomUUIDv7(),
        ...row,
        createdAt: now,
      });
    }
  }

  await db
    .update(webflowSyncState)
    .set({ lastSyncedAt: now })
    .where(eq(webflowSyncState.siteId, siteId));

  return { synced: (data.items ?? []).length };
}

export async function publishWebflowItem(siteId: string, localId: string) {
  const env = getMarketingEnv();
  const [item] = await db
    .select()
    .from(webflowBlogItem)
    .where(eq(webflowBlogItem.id, localId))
    .limit(1);
  if (!item) throw new Error("Article introuvable");

  const { collectionId } = await ensureBlogCollection(siteId);
  const fieldData = {
    name: item.title,
    slug: item.slug,
    "post-summary": item.summary ?? "",
    "post-body": item.body,
    author: item.author ?? "",
    "meta-title": item.metaTitle ?? item.title,
    "meta-description": item.metaDescription ?? item.summary ?? "",
  };

  if (item.webflowItemId) {
    await webflowFetch(`/collections/${collectionId}/items/${item.webflowItemId}`, {
      method: "PATCH",
      body: JSON.stringify({ fieldData, isDraft: false }),
    });
    await webflowFetch(`/collections/${collectionId}/items/${item.webflowItemId}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  } else {
    const created = (await webflowFetch(`/collections/${collectionId}/items`, {
      method: "POST",
      body: JSON.stringify({ fieldData, isDraft: false }),
    })) as { id: string };
    await webflowFetch(`/collections/${collectionId}/items/${created.id}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await db
      .update(webflowBlogItem)
      .set({ webflowItemId: created.id, status: "published", isDraft: false, publishedAt: new Date() })
      .where(eq(webflowBlogItem.id, localId));
    return;
  }

  await db
    .update(webflowBlogItem)
    .set({ status: "published", isDraft: false, publishedAt: new Date(), siteId: env.webflowSiteId })
    .where(eq(webflowBlogItem.id, localId));
}
