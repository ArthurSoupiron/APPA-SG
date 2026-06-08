import {
  boolean,
  index,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { marketingSchema } from "../schemas";

export const WEBFLOW_ITEM_STATUSES = ["draft", "published", "archived"] as const;
export type WebflowItemStatus = (typeof WEBFLOW_ITEM_STATUSES)[number];

export const webflowSyncState = marketingSchema.table(
  "webflow_sync_state",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").notNull(),
    collectionId: text("collection_id"),
    collectionSlug: text("collection_slug").notNull().default("blog"),
    lastSyncedAt: timestamp("last_synced_at"),
    meta: jsonb("meta"),
  },
  (t) => [uniqueIndex("webflow_sync_state_site_uidx").on(t.siteId)],
);

export const webflowBlogItem = marketingSchema.table(
  "webflow_blog_item",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").notNull(),
    webflowItemId: text("webflow_item_id"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    body: text("body").notNull().default(""),
    author: text("author"),
    imageUrl: text("image_url"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    categories: text("categories"),
    status: text("status").$type<WebflowItemStatus>().notNull().default("draft"),
    publishedAt: timestamp("published_at"),
    isDraft: boolean("is_draft").notNull().default(true),
    fieldData: jsonb("field_data"),
    lastSyncedAt: timestamp("last_synced_at"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("webflow_blog_item_site_slug_uidx").on(t.siteId, t.slug),
    index("webflow_blog_item_status_idx").on(t.status),
    index("webflow_blog_item_webflow_id_idx").on(t.webflowItemId),
  ],
);
