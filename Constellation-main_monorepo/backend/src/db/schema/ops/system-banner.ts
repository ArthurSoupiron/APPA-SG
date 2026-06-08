import { sql } from "drizzle-orm";
import { boolean, check, index, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { opsSchema } from "../schemas";

export const systemBanner = opsSchema.table(
  "system_banner",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    severity: text("severity").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    startsAt: timestamp("starts_at").defaultNow().notNull(),
    endsAt: timestamp("ends_at"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    check("system_banner_severity_check", sql`${t.severity} IN ('info', 'warning', 'critical')`),
    index("system_banner_active_idx").on(t.isActive),
    index("system_banner_starts_idx").on(t.startsAt),
  ],
);
