import { sql } from "drizzle-orm";
import { check, index, primaryKey, text } from "drizzle-orm/pg-core";

import { actionPlanSchema } from "../schemas";
import { actionPlanAction } from "./action";
import { ACTION_PLAN_POLE_SQL, type ActionPlanPole } from "./enums";

export const actionPlanActionPole = actionPlanSchema.table(
  "action_pole",
  {
    actionId: text("action_id")
      .notNull()
      .references(() => actionPlanAction.id, { onDelete: "cascade" }),
    pole: text("pole").$type<ActionPlanPole>().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.actionId, t.pole] }),
    index("action_pole_pole_idx").on(t.pole),
    check("action_pole_check", sql`${t.pole} IN (${sql.raw(ACTION_PLAN_POLE_SQL)})`),
  ],
);
