import { relations } from "drizzle-orm";

import { actionPlanAction } from "./action";
import { actionPlanActionPole } from "./action-pole";
import { actionPlanAxis } from "./axis";
import { actionPlanSmart } from "./smart";
import { actionPlanSubAction } from "./sub-action";
import { actionPlanSubActionPole } from "./sub-action-pole";
import { actionPlanSubAxis } from "./sub-axis";

export const actionPlanAxisRelations = relations(actionPlanAxis, ({ many }) => ({
  subAxes: many(actionPlanSubAxis),
}));

export const actionPlanSubAxisRelations = relations(actionPlanSubAxis, ({ one, many }) => ({
  axis: one(actionPlanAxis, {
    fields: [actionPlanSubAxis.axisId],
    references: [actionPlanAxis.id],
  }),
  smarts: many(actionPlanSmart),
}));

export const actionPlanSmartRelations = relations(actionPlanSmart, ({ one, many }) => ({
  subAxis: one(actionPlanSubAxis, {
    fields: [actionPlanSmart.subAxisId],
    references: [actionPlanSubAxis.id],
  }),
  actions: many(actionPlanAction),
}));

export const actionPlanActionRelations = relations(actionPlanAction, ({ one, many }) => ({
  smart: one(actionPlanSmart, {
    fields: [actionPlanAction.smartId],
    references: [actionPlanSmart.id],
  }),
  subActions: many(actionPlanSubAction),
  poles: many(actionPlanActionPole),
}));

export const actionPlanSubActionRelations = relations(actionPlanSubAction, ({ one, many }) => ({
  action: one(actionPlanAction, {
    fields: [actionPlanSubAction.actionId],
    references: [actionPlanAction.id],
  }),
  poles: many(actionPlanSubActionPole),
}));

export const actionPlanActionPoleRelations = relations(actionPlanActionPole, ({ one }) => ({
  action: one(actionPlanAction, {
    fields: [actionPlanActionPole.actionId],
    references: [actionPlanAction.id],
  }),
}));

export const actionPlanSubActionPoleRelations = relations(
  actionPlanSubActionPole,
  ({ one }) => ({
    subAction: one(actionPlanSubAction, {
      fields: [actionPlanSubActionPole.subActionId],
      references: [actionPlanSubAction.id],
    }),
  }),
);
