import { text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { missionSchema } from "../schemas";
import { missionBcDesignation, missionBonCommande } from "./bon-commande";
import { rmiTypeEnum } from "./enums";

export const missionRmi = missionSchema.table("mission_rmi", {
  id: text("id").primaryKey(),
  bcId: text("bc_id")
    .notNull()
    .references(() => missionBonCommande.id, { onDelete: "cascade" }),
  replacedById: text("replaced_by_id"),
  cdpId: text("cdp_id").references(() => user.id, { onDelete: "set null" }),
  type: rmiTypeEnum("type").notNull().default("RMI"),
  rmiNumber: text("rmi_number").notNull(),
  generatedFileId: text("generated_file_id"),
  meetingDate: timestamp("meeting_date"),
  participants: text("participants"),
  notes: text("notes"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const missionRmiIntervenantAssignation = missionSchema.table(
  "mission_rmi_intervenant_assignation",
  {
    id: text("id").primaryKey(),
    rmiId: text("rmi_id")
      .notNull()
      .references(() => missionRmi.id, { onDelete: "cascade" }),
    intervenantId: text("intervenant_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    designationId: text("designation_id").references(() => missionBcDesignation.id, {
      onDelete: "set null",
    }),
    startDate: timestamp("start_date"),
    deadline: timestamp("deadline"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
);
