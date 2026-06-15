import { boolean, index, integer, text, timestamp } from "drizzle-orm/pg-core";

import { sgSchema } from "../schemas";

/** Cache des user groups Slack natifs (@ao, @groupe_nda, …). */
export const slackUserGroup = sgSchema.table(
  "slack_user_groups",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    handle: text("handle").notNull().default(""),
    description: text("description").notNull().default(""),
    userCount: integer("user_count").notNull().default(0),
    isDisabled: boolean("is_disabled").notNull().default(false),
    lastRefreshedAt: timestamp("last_refreshed_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("slack_user_groups_name_idx").on(t.name),
    index("slack_user_groups_last_refreshed_idx").on(t.lastRefreshedAt),
  ],
);
