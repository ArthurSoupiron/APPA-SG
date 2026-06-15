import { pgEnum } from "drizzle-orm/pg-core";

export const bonCommandeTypeEnum = pgEnum("bon_commande_type", ["BC", "BCR"]);
export const rmiTypeEnum = pgEnum("rmi_type", ["RMI", "ARMI", "AARMI"]);

export const revisionChangeTypeEnum = pgEnum("revision_change_type", [
  "create",
  "update",
  "avenant",
]);

export const missionDocumentEventTypeEnum = pgEnum("mission_document_event_type", [
  "bc_created",
  "bc_updated",
  "bc_avenant",
  "rmi_created",
  "rmi_updated",
  "rmi_avenant",
  "fa_created",
  "fa_updated",
  "fa_avenant",
  "fs_created",
  "fs_updated",
  "fs_avenant",
  "bv_created",
  "bv_updated",
  "bv_avenant",
  "pvrf_created",
  "pvrf_updated",
  "pvrf_avenant",
  "qs_created",
  "qs_updated",
  "qs_avenant",
]);

export type BonCommandeType = "BC" | "BCR";
export type RMIType = "RMI" | "ARMI" | "AARMI";
export type RevisionChangeType = "create" | "update" | "avenant";
export type MissionDocumentEventType =
  | "bc_created"
  | "bc_updated"
  | "bc_avenant"
  | "rmi_created"
  | "rmi_updated"
  | "rmi_avenant"
  | "fa_created"
  | "fa_updated"
  | "fa_avenant"
  | "fs_created"
  | "fs_updated"
  | "fs_avenant"
  | "bv_created"
  | "bv_updated"
  | "bv_avenant"
  | "pvrf_created"
  | "pvrf_updated"
  | "pvrf_avenant"
  | "qs_created"
  | "qs_updated"
  | "qs_avenant";
