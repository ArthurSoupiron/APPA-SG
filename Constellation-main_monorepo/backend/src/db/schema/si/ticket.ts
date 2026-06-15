import { sql } from "drizzle-orm";
import { check, index, jsonb, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { siSchema } from "../schemas";

export const SI_TICKET_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
  "cancelled",
] as const;
export type SiTicketStatus = (typeof SI_TICKET_STATUSES)[number];

export const SI_TICKET_CATEGORIES = ["bug", "acces", "demande", "autre"] as const;
export type SiTicketCategory = (typeof SI_TICKET_CATEGORIES)[number];

export const ticket = siSchema.table(
  "ticket",
  {
    id: text("id").primaryKey(),
    reference: text("reference").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull().default("open"),
    category: text("category").notNull().default("autre"),
    creatorUserId: text("creator_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    assigneeUserId: text("assignee_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    driveFolderId: text("drive_folder_id"),
    driveFolderUrl: text("drive_folder_url"),
    auditSnapshot: jsonb("audit_snapshot").$type<Record<string, unknown>[] | null>(),
    lastExportedAt: timestamp("last_exported_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    closedAt: timestamp("closed_at"),
  },
  (t) => [
    uniqueIndex("ticket_reference_unique").on(t.reference),
    index("ticket_status_idx").on(t.status),
    index("ticket_creator_idx").on(t.creatorUserId),
    index("ticket_assignee_idx").on(t.assigneeUserId),
    index("ticket_created_at_idx").on(t.createdAt),
    check(
      "ticket_status_check",
      sql`${t.status} IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')`,
    ),
    check(
      "ticket_category_check",
      sql`${t.category} IN ('bug', 'acces', 'demande', 'autre')`,
    ),
  ],
);
