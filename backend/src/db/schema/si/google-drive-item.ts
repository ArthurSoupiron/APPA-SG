import { relations } from "drizzle-orm";
import { index, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { siSchema } from "../schemas";

/**
 * Fichiers / dossiers Drive (schéma SQL `si`).
 * Jetons OAuth Google : `auth.account`.
 */
export const googleDriveItem = siSchema.table(
  "google_drive_item",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    driveFileId: text("drive_file_id").notNull(),
    name: text("name"),
    mimeType: text("mime_type"),
    webViewLink: text("web_view_link"),
    parentFolderId: text("parent_folder_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("gdi_user_idx").on(t.userId),
    index("gdi_drive_file_idx").on(t.driveFileId),
    uniqueIndex("gdi_user_drive_file_unique").on(t.userId, t.driveFileId),
  ],
);

export const googleDriveItemRelations = relations(googleDriveItem, ({ one }) => ({
  user: one(user, {
    fields: [googleDriveItem.userId],
    references: [user.id],
  }),
}));
