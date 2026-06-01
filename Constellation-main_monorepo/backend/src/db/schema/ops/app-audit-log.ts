import { index, jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { opsSchema } from "../schemas";

export const appAuditLog = opsSchema.table(
  "app_audit_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),
    requestPath: text("request_path"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("app_audit_log_user_created_idx").on(t.userId, t.createdAt),
    index("app_audit_log_resource_idx").on(t.resourceType, t.resourceId),
  ],
);
