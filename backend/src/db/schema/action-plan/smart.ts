import { index, integer, text, timestamp } from "drizzle-orm/pg-core";

import { actionPlanSchema } from "../schemas";
import { actionPlanSubAxis } from "./sub-axis";

export const actionPlanSmart = actionPlanSchema.table(
  "smart",
  {
    id: text("id").primaryKey(),
    subAxisId: text("sub_axis_id")
      .notNull()
      .references(() => actionPlanSubAxis.id, { onDelete: "cascade" }),
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
    index("smart_sub_axis_id_idx").on(t.subAxisId),
    index("smart_sort_order_idx").on(t.sortOrder),
  ],
);
