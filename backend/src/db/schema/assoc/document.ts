import { boolean, integer, jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { assocSchema } from "../schemas";

/**
 * Document de la GED associative. Peut être rattaché à un fichier Google Drive
 * (driveFileId / driveWebViewLink) et porter une signature manuscrite numérique
 * (signatureData = image PNG en base64).
 */
export const assocDocument = assocSchema.table("document", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  cat: text("cat").notNull(),
  pages: integer("pages").notNull().default(1),
  format: text("format").notNull().default("PDF"),
  size: text("size").notNull().default("—"),
  mandat: text("mandat").notNull().default("25–26"),
  ref: text("ref").notNull(),
  status: text("status").notNull().default("pending"), // pending | signed | archived
  author: text("author").notNull().default(""),
  signers: jsonb("signers").$type<string[]>().notNull().default([]),
  date: text("date").notNull(),
  dateAbs: text("date_abs").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  security: text("security").notNull().default("Interne"),
  fav: boolean("fav").notNull().default(false),
  // --- Google Drive ---
  driveFileId: text("drive_file_id"),
  driveWebViewLink: text("drive_web_view_link"),
  // --- Signature numérique ---
  signatureData: text("signature_data"),
  signedBy: text("signed_by"),
  signedAt: text("signed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
