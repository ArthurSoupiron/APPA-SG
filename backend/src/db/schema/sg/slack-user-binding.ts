import { index, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { sgSchema } from "../schemas";

export const slackUserBinding = sgSchema.table(
  "slack_user_binding",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slackUserId: text("slack_user_id").notNull(),
    slackTeamId: text("slack_team_id").notNull(),
    slackDisplayName: text("slack_display_name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("sub_slack_user_idx").on(t.slackUserId),
    index("sub_team_idx").on(t.slackTeamId),
    uniqueIndex("sub_user_team_unique").on(t.userId, t.slackTeamId),
  ],
);
