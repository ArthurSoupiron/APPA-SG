import { integer, jsonb, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { assocSchema } from "../schemas";

/**
 * Membre de l'association (tableau de suivi SG).
 * Les mandats sont stockés en JSON sur le membre : un membre peut cumuler
 * plusieurs mandats au fil des années sans créer de doublon de fiche.
 * L'unicité est garantie par l'email (pas de doublon de membre).
 */
export const assocMember = assocSchema.table(
  "member",
  {
    id: text("id").primaryKey(),
    first: text("first").notNull(),
    last: text("last").notNull(),
    initials: text("initials").notNull(),
    role: text("role").notNull(),
    pole: text("pole").notNull(),
    promo: integer("promo").notNull(),
    year: text("year").notNull(),
    status: text("status").notNull(), // active | pending | alumni | inactive
    email: text("email").notNull(),
    phone: text("phone").notNull().default("—"),
    joined: text("joined").notNull(),
    city: text("city").notNull().default("—"),
    address: text("address"),
    studentId: text("student_id"),
    jeeceId: text("jeece_id"),
    birth: text("birth"),
    /** état des pièces requises : { BA: "ok", RIB: "missing", ... } */
    docs: jsonb("docs").$type<Record<string, string>>().notNull().default({}),
    /** historique des mandats : [{ role, period, current }] */
    mandates: jsonb("mandates").$type<unknown[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [uniqueIndex("assoc_member_email_unique").on(t.email)],
);
