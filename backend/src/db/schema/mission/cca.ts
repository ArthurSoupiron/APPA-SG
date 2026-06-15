import { text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { missionSchema } from "../schemas";
import { commercialClient } from "./commercial-client";
import { commercialEntreprise } from "./commercial-entreprise";

export const missionCca = missionSchema.table("mission_cca", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => commercialClient.id, { onDelete: "restrict" }),
  entrepriseId: text("entreprise_id")
    .notNull()
    .references(() => commercialEntreprise.id, { onDelete: "restrict" }),
  cdpId: text("cdp_id").references(() => user.id, { onDelete: "set null" }),
  missionName: text("mission_name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  driveFolderId: text("drive_folder_id"),
  generatedFileId: text("generated_file_id"),
  slackChannelId: text("slack_channel_id"),
});
