import { sql } from "drizzle-orm";
import { check, index, integer, text, timestamp } from "drizzle-orm/pg-core";

import { actionPlanSchema } from "../schemas";
import {
  ACTION_PLAN_CAMPUS_SQL,
  ACTION_PLAN_STATUS_SQL,
  type ActionPlanCampus,
  type ActionPlanStatus,
} from "./enums";
import { actionPlanSmart } from "./smart";

export const actionPlanAction = actionPlanSchema.table(
  "action",
  {
    id: text("id").primaryKey(),
    smartId: text("smart_id")
      .notNull()
      .references(() => actionPlanSmart.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    owner: text("owner"),
    status: text("status").$type<ActionPlanStatus>().notNull().default("not_started"),
    progress: integer("progress").notNull().default(0),
    priority: integer("priority"),
    sortOrder: integer("sort_order").notNull().default(0),
    startDate: timestamp("start_date"),
    dueDate: timestamp("due_date"),
    campus: text("campus").$type<ActionPlanCampus>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("action_smart_id_idx").on(t.smartId),
    index("action_status_idx").on(t.status),
    index("action_sort_order_idx").on(t.sortOrder),
    check("action_progress_check", sql`${t.progress} >= 0 AND ${t.progress} <= 100`),
    check("action_status_check", sql`${t.status} IN (${sql.raw(ACTION_PLAN_STATUS_SQL)})`),
    check(
      "action_campus_check",
      sql`${t.campus} IS NULL OR ${t.campus} IN (${sql.raw(ACTION_PLAN_CAMPUS_SQL)})`,
    ),
  ],
);
