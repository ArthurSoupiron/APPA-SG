import { index, jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { crmSchema } from "../schemas";

export const CRM_AUDIT_ENTITY_TYPES = ["prospect", "sprint"] as const;
export type CrmAuditEntityType = (typeof CRM_AUDIT_ENTITY_TYPES)[number];

export const crmAuditLog = crmSchema.table(
  "crm_audit_log",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("crm_audit_log_entity_created_idx").on(t.entityType, t.entityId, t.createdAt),
    index("crm_audit_log_user_idx").on(t.userId),
  ],
);
