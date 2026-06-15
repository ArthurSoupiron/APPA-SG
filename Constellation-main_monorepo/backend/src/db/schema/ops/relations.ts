import { relations } from "drizzle-orm";

import { user } from "../auth/user";
import { appAuditLog } from "./app-audit-log";
import { asyncJob } from "./async-job";
import { systemBanner } from "./system-banner";

export const asyncJobRelations = relations(asyncJob, ({ one }) => ({
  creator: one(user, {
    fields: [asyncJob.createdBy],
    references: [user.id],
  }),
}));

export const appAuditLogRelations = relations(appAuditLog, ({ one }) => ({
  user: one(user, {
    fields: [appAuditLog.userId],
    references: [user.id],
  }),
}));

export const systemBannerRelations = relations(systemBanner, ({ one }) => ({
  createdByUser: one(user, {
    fields: [systemBanner.createdBy],
    references: [user.id],
  }),
}));
