import { index, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { sgSchema } from "../schemas";

export const slackWorkspaceBinding = sgSchema.table(
  "slack_workspace_binding",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id").notNull().unique(),
    teamName: text("team_name"),
    botUserId: text("bot_user_id"),
    installedByUserId: text("installed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("swb_installer_idx").on(t.installedByUserId)],
);
