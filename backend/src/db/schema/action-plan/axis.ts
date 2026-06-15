import { index, integer, text, timestamp } from "drizzle-orm/pg-core";

import { actionPlanSchema } from "../schemas";

export const actionPlanAxis = actionPlanSchema.table(
  "axis",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("axis_sort_order_idx").on(t.sortOrder)],
);
