import { jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { missionSchema } from "../schemas";

/** Balises extraites des modèles Drive (dossier Template) après synchro Config. */
export const gmDriveTemplateTags = missionSchema.table("gm_drive_template_tags", {
  docType: text("doc_type").primaryKey(),
  driveFileId: text("drive_file_id").notNull(),
  driveFileName: text("drive_file_name").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});
