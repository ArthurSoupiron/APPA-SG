import { relations } from "drizzle-orm";

import { user } from "../auth/user";
import { contactEvent } from "./contact-event";
import { crmAuditLog } from "./crm-audit-log";
import { crmSprint } from "./crm-sprint";
import { prospect } from "./prospect";
import { prospectNote } from "./prospect-note";
import { prospectStatusLog } from "./prospect-status-log";
import { sprintMember } from "./sprint-member";
import { sprintProspect } from "./sprint-prospect";

export const prospectRelations = relations(prospect, ({ one, many }) => ({
  creator: one(user, { fields: [prospect.createdBy], references: [user.id] }),
  statusLogs: many(prospectStatusLog),
  notes: many(prospectNote),
  contactEvents: many(contactEvent),
  sprintProspects: many(sprintProspect),
}));

export const prospectStatusLogRelations = relations(prospectStatusLog, ({ one }) => ({
  prospect: one(prospect, {
    fields: [prospectStatusLog.prospectId],
    references: [prospect.id],
  }),
  user: one(user, {
    fields: [prospectStatusLog.userId],
    references: [user.id],
  }),
}));

export const prospectNoteRelations = relations(prospectNote, ({ one }) => ({
  prospect: one(prospect, {
    fields: [prospectNote.prospectId],
    references: [prospect.id],
  }),
  user: one(user, {
    fields: [prospectNote.userId],
    references: [user.id],
  }),
}));

export const contactEventRelations = relations(contactEvent, ({ one }) => ({
  prospect: one(prospect, {
    fields: [contactEvent.prospectId],
    references: [prospect.id],
  }),
  user: one(user, {
    fields: [contactEvent.userId],
    references: [user.id],
  }),
}));

export const crmAuditLogRelations = relations(crmAuditLog, ({ one }) => ({
  user: one(user, {
    fields: [crmAuditLog.userId],
    references: [user.id],
  }),
}));

export const crmSprintRelations = relations(crmSprint, ({ one, many }) => ({
  creator: one(user, {
    fields: [crmSprint.createdBy],
    references: [user.id],
  }),
  members: many(sprintMember),
  prospects: many(sprintProspect),
}));

export const sprintMemberRelations = relations(sprintMember, ({ one }) => ({
  sprint: one(crmSprint, {
    fields: [sprintMember.sprintId],
    references: [crmSprint.id],
  }),
  user: one(user, {
    fields: [sprintMember.userId],
    references: [user.id],
  }),
}));

export const sprintProspectRelations = relations(sprintProspect, ({ one }) => ({
  sprint: one(crmSprint, {
    fields: [sprintProspect.sprintId],
    references: [crmSprint.id],
  }),
  prospect: one(prospect, {
    fields: [sprintProspect.prospectId],
    references: [prospect.id],
  }),
  assignedUser: one(user, {
    fields: [sprintProspect.assignedUserId],
    references: [user.id],
  }),
}));
