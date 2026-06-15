import { index, integer, text, timestamp } from "drizzle-orm/pg-core";

import { actionPlanSchema } from "../schemas";
import { actionPlanAxis } from "./axis";

export const actionPlanSubAxis = actionPlanSchema.table(
  "sub_axis",
  {
    id: text("id").primaryKey(),
    axisId: text("axis_id")
      .notNull()
      .references(() => actionPlanAxis.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("sub_axis_axis_id_idx").on(t.axisId),
    index("sub_axis_sort_order_idx").on(t.sortOrder),
  ],
);
