import { index, jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { marketingSchema } from "../schemas";

/** Cache des métriques page LinkedIn (payload API brut + métadonnées). */
export const linkedinCache = marketingSchema.table(
  "linkedin_cache",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    payload: jsonb("payload").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
    syncedByUserId: text("synced_by_user_id"),
  },
  (t) => [index("linkedin_cache_org_fetched_idx").on(t.organizationId, t.fetchedAt)],
);
