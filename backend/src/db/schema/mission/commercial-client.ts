import { index, text, timestamp } from "drizzle-orm/pg-core";

import { prospect } from "../crm/prospect";
import { missionSchema } from "../schemas";

export const commercialClient = missionSchema.table(
  "commercial_clients",
  {
    id: text("id").primaryKey(),
    nomClient: text("nom_client").notNull(),
    prenomClient: text("prenom_client").notNull().default(""),
    telephoneClient: text("telephone_client").notNull().default(""),
    mailClient: text("mail_client").notNull().default(""),
    prospectId: text("prospect_id").references(() => prospect.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("commercial_clients_prospect_idx").on(t.prospectId)],
);
