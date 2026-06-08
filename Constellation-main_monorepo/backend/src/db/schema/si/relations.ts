import { relations } from "drizzle-orm";

import { user } from "../auth/user";
import { ticket } from "./ticket";
import { ticketAttachment } from "./ticket-attachment";
import { ticketComment } from "./ticket-comment";
import { ticketNotification } from "./ticket-notification";
import { ticketStatusLog } from "./ticket-status-log";
import { ticketWatcher } from "./ticket-watcher";

export const ticketRelations = relations(ticket, ({ one, many }) => ({
  creator: one(user, { fields: [ticket.creatorUserId], references: [user.id] }),
  assignee: one(user, { fields: [ticket.assigneeUserId], references: [user.id] }),
  statusLogs: many(ticketStatusLog),
  comments: many(ticketComment),
  attachments: many(ticketAttachment),
  watchers: many(ticketWatcher),
  notifications: many(ticketNotification),
}));

export const ticketStatusLogRelations = relations(ticketStatusLog, ({ one }) => ({
  ticket: one(ticket, { fields: [ticketStatusLog.ticketId], references: [ticket.id] }),
  user: one(user, { fields: [ticketStatusLog.userId], references: [user.id] }),
}));

export const ticketCommentRelations = relations(ticketComment, ({ one }) => ({
  ticket: one(ticket, { fields: [ticketComment.ticketId], references: [ticket.id] }),
  user: one(user, { fields: [ticketComment.userId], references: [user.id] }),
}));

export const ticketAttachmentRelations = relations(ticketAttachment, ({ one }) => ({
  ticket: one(ticket, { fields: [ticketAttachment.ticketId], references: [ticket.id] }),
  uploader: one(user, { fields: [ticketAttachment.uploadedBy], references: [user.id] }),
}));

export const ticketWatcherRelations = relations(ticketWatcher, ({ one }) => ({
  ticket: one(ticket, { fields: [ticketWatcher.ticketId], references: [ticket.id] }),
  user: one(user, { fields: [ticketWatcher.userId], references: [user.id] }),
}));

export const ticketNotificationRelations = relations(ticketNotification, ({ one }) => ({
  ticket: one(ticket, { fields: [ticketNotification.ticketId], references: [ticket.id] }),
  user: one(user, { fields: [ticketNotification.userId], references: [user.id] }),
}));
