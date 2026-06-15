import { index, integer, jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { missionSchema } from "../schemas";
import { missionBonCommande } from "./bon-commande";
import { missionCca } from "./cca";
import { missionDocumentEventTypeEnum, revisionChangeTypeEnum } from "./enums";

function makeRevisionTable(tableName: string) {
  return missionSchema.table(
    tableName,
    {
      id: text("id").primaryKey(),
      entityId: text("entity_id").notNull(),
      revisionNumber: integer("revision_number").notNull().default(1),
      changeType: revisionChangeTypeEnum("change_type").notNull(),
      payloadSnapshot: jsonb("payload_snapshot"),
      changedBy: text("changed_by").references(() => user.id, { onDelete: "set null" }),
      reason: text("reason"),
      changedAt: timestamp("changed_at").defaultNow().notNull(),
    },
    (t) => [index(`${tableName}_entity_idx`).on(t.entityId, t.revisionNumber)],
  );
}

export const missionBcRevision = makeRevisionTable("mission_bc_revision");
export const missionRmiRevision = makeRevisionTable("mission_rmi_revision");
export const missionFaRevision = makeRevisionTable("mission_fa_revision");
export const missionFsRevision = makeRevisionTable("mission_fs_revision");
export const missionBvRevision = makeRevisionTable("mission_bv_revision");
export const missionPvrfRevision = makeRevisionTable("mission_pvrf_revision");
export const missionQsRevision = makeRevisionTable("mission_qs_revision");

export const missionDocumentEvent = missionSchema.table(
  "mission_document_events",
  {
    id: text("id").primaryKey(),
    missionId: text("mission_id")
      .notNull()
      .references(() => missionCca.id, { onDelete: "cascade" }),
    bcId: text("bc_id").references(() => missionBonCommande.id, { onDelete: "set null" }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    eventType: missionDocumentEventTypeEnum("event_type").notNull(),
    revisionNumber: integer("revision_number").default(1),
    label: text("label").notNull(),
    changedBy: text("changed_by").references(() => user.id, { onDelete: "set null" }),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
  },
  (t) => [
    index("mission_document_events_mission_idx").on(t.missionId, t.changedAt),
    index("mission_document_events_bc_idx").on(t.bcId),
  ],
);
