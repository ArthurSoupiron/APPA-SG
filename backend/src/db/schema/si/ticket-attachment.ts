import { index, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { siSchema } from "../schemas";
import { ticket } from "./ticket";

export const ticketAttachment = siSchema.table(
  "ticket_attachment",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    driveFileId: text("drive_file_id").notNull(),
    name: text("name").notNull(),
    mimeType: text("mime_type"),
    webViewLink: text("web_view_link"),
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("ticket_attachment_ticket_idx").on(t.ticketId),
    uniqueIndex("ticket_attachment_drive_file_unique").on(t.ticketId, t.driveFileId),
  ],
);
