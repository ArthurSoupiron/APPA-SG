import { sql } from "drizzle-orm";
import { check, index, jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { crmSchema } from "../schemas";
import { prospect } from "./prospect";

export const CONTACT_EVENT_KINDS = ["appel", "email", "rdv", "linkedin", "autre"] as const;
export type ContactEventKind = (typeof CONTACT_EVENT_KINDS)[number];

export const contactEvent = crmSchema.table(
  "contact_event",
  {
    id: text("id").primaryKey(),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => prospect.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    check(
      "contact_event_kind_check",
      sql`${t.kind} IN ('appel', 'email', 'rdv', 'linkedin', 'autre')`,
    ),
    index("contact_event_prospect_created_idx").on(t.prospectId, t.createdAt),
    index("contact_event_user_idx").on(t.userId),
  ],
);
