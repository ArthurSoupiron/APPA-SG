import { index, jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { marketingSchema } from "../schemas";

/** Cache chaîne YouTube + analytics (payload API brut). */
export const youtubeCache = marketingSchema.table(
  "youtube_cache",
  {
    id: text("id").primaryKey(),
    channelId: text("channel_id").notNull(),
    payload: jsonb("payload").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
    syncedByUserId: text("synced_by_user_id"),
  },
  (t) => [index("youtube_cache_channel_fetched_idx").on(t.channelId, t.fetchedAt)],
);
