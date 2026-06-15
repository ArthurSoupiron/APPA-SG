import { boolean, decimal, integer, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { missionSchema } from "../schemas";
import { missionCca } from "./cca";
import { bonCommandeTypeEnum } from "./enums";

export const missionBonCommande = missionSchema.table("mission_bon_commande", {
  id: text("id").primaryKey(),
  ccaId: text("cca_id")
    .notNull()
    .references(() => missionCca.id, { onDelete: "cascade" }),
  replacedById: text("replaced_by_id"),
  type: bonCommandeTypeEnum("type").notNull().default("BC"),
  bcNumber: text("bc_number").notNull(),
  livre: boolean("livre").notNull().default(false),
  planningDate: timestamp("planning_date"),
  planningEndDate: timestamp("planning_end_date"),
  generatedFileId: text("generated_file_id"),
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

export const missionBcDesignation = missionSchema.table("mission_bc_designation", {
  id: text("id").primaryKey(),
  bcId: text("bc_id")
    .notNull()
    .references(() => missionBonCommande.id, { onDelete: "cascade" }),
  intervenantId: text("intervenant_id").references(() => user.id, { onDelete: "set null" }),
  titre: text("titre").notNull(),
  description: text("description"),
  nbJeh: integer("nb_jeh"),
  montantJeh: decimal("montant_jeh", { precision: 10, scale: 2 }),
  prixTotalHt: decimal("prix_total_ht", { precision: 10, scale: 2 }),
  tva: decimal("tva", { precision: 10, scale: 2 }),
  totalTtc: decimal("total_ttc", { precision: 10, scale: 2 }),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const missionBcFrais = missionSchema.table("mission_bc_frais", {
  id: text("id").primaryKey(),
  bcId: text("bc_id")
    .notNull()
    .references(() => missionBonCommande.id, { onDelete: "cascade" }),
  texte: text("texte").notNull(),
  montantHt: decimal("montant_ht", { precision: 10, scale: 2 }),
  tva: decimal("tva", { precision: 10, scale: 2 }),
  totalTtc: decimal("total_ttc", { precision: 10, scale: 2 }),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
