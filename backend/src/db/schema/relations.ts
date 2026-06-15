import { relations } from "drizzle-orm";

import { account, session, user } from "./auth";
import { slackUserBinding } from "./sg";
import { googleDriveItem } from "./si";

/** Relations `user` agrégées (évite les cycles entre dossiers). */
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  googleDriveItems: many(googleDriveItem),
  slackUserBindings: many(slackUserBinding),
}));
