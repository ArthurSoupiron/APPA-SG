import { index, text, timestamp } from "drizzle-orm/pg-core";

import { gwSchema } from "../schemas";

/** Groupe Google Directory (cache). PK = identifiant stable côté Google. */
export const workspaceGroup = gwSchema.table(
  "workspace_group",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    description: text("description"),
    etag: text("etag"),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
  },
  (t) => [index("wg_email_idx").on(t.email)],
);
