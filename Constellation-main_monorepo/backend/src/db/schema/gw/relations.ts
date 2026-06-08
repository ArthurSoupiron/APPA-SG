import { relations } from "drizzle-orm";

import { user } from "../auth/user";
import { workspaceGroup } from "./workspace-group";
import { workspaceGroupMember } from "./workspace-group-member";
import { workspaceGroupPermission } from "./workspace-group-permission";

export const workspaceGroupRelations = relations(workspaceGroup, ({ many }) => ({
  outgoingMembers: many(workspaceGroupMember, {
    relationName: "containerGroup",
  }),
  incomingAsNested: many(workspaceGroupMember, {
    relationName: "nestedGroup",
  }),
  groupPermissions: many(workspaceGroupPermission),
}));

export const workspaceGroupMemberRelations = relations(workspaceGroupMember, ({ one }) => ({
  containerGroup: one(workspaceGroup, {
    fields: [workspaceGroupMember.containerGroupId],
    references: [workspaceGroup.id],
    relationName: "containerGroup",
  }),
  nestedGroup: one(workspaceGroup, {
    fields: [workspaceGroupMember.memberNestedGroupId],
    references: [workspaceGroup.id],
    relationName: "nestedGroup",
  }),
  user: one(user, {
    fields: [workspaceGroupMember.userId],
    references: [user.id],
  }),
}));

export const workspaceGroupPermissionRelations = relations(workspaceGroupPermission, ({ one }) => ({
  workspaceGroup: one(workspaceGroup, {
    fields: [workspaceGroupPermission.workspaceGroupId],
    references: [workspaceGroup.id],
  }),
}));
