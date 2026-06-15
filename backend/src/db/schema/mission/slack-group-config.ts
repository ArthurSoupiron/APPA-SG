import { text, timestamp } from "drizzle-orm/pg-core";

import { missionSchema } from "../schemas";

export const missionSlackGroupConfig = missionSchema.table("mission_slack_group_config", {
  groupId: text("group_id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
