import { jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { missionSchema } from "../schemas";

/** Registre des templates HTML par type de document (CCA, BC, …). */
export const missionHtmlTemplateRegistry = missionSchema.table("gm_html_template_registry", {
  docType: text("doc_type").primaryKey(),
  templatePath: text("template_path").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});
