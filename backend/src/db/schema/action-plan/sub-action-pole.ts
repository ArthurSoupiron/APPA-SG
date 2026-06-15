import { sql } from "drizzle-orm";
import { check, index, primaryKey, text } from "drizzle-orm/pg-core";

import { actionPlanSchema } from "../schemas";
import { ACTION_PLAN_POLE_SQL, type ActionPlanPole } from "./enums";
import { actionPlanSubAction } from "./sub-action";

export const actionPlanSubActionPole = actionPlanSchema.table(
  "sub_action_pole",
  {
    subActionId: text("sub_action_id")
      .notNull()
      .references(() => actionPlanSubAction.id, { onDelete: "cascade" }),
    pole: text("pole").$type<ActionPlanPole>().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.subActionId, t.pole] }),
    index("sub_action_pole_pole_idx").on(t.pole),
    check("sub_action_pole_check", sql`${t.pole} IN (${sql.raw(ACTION_PLAN_POLE_SQL)})`),
  ],
);
