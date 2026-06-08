import { relations } from "drizzle-orm";

import { user } from "../auth/user";
import { slackUserBinding } from "./slack-user-binding";
import { slackWorkspaceBinding } from "./slack-workspace-binding";

export const slackWorkspaceBindingRelations = relations(slackWorkspaceBinding, ({ one }) => ({
  installedBy: one(user, {
    fields: [slackWorkspaceBinding.installedByUserId],
    references: [user.id],
  }),
}));

export const slackUserBindingRelations = relations(slackUserBinding, ({ one }) => ({
  user: one(user, {
    fields: [slackUserBinding.userId],
    references: [user.id],
  }),
}));
