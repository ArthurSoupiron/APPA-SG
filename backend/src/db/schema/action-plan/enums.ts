import { AGENDA_POLES, type AgendaPole } from "../agenda/poles";

/** Pôles alignés sur l'agenda / nav organisationnelle. */
export const ACTION_PLAN_POLES = AGENDA_POLES;
export type ActionPlanPole = AgendaPole;

export const ACTION_PLAN_POLE_SQL = ACTION_PLAN_POLES.map((p) => `'${p}'`).join(", ");

export const ACTION_PLAN_STATUSES = [
  "not_started",
  "in_progress",
  "done",
  "blocked",
] as const;
export type ActionPlanStatus = (typeof ACTION_PLAN_STATUSES)[number];

export const ACTION_PLAN_STATUS_SQL = ACTION_PLAN_STATUSES.map((s) => `'${s}'`).join(
  ", ",
);

export const ACTION_PLAN_CAMPUSES = ["paris", "lyon", "marseille"] as const;
export type ActionPlanCampus = (typeof ACTION_PLAN_CAMPUSES)[number];

export const ACTION_PLAN_CAMPUS_SQL = ACTION_PLAN_CAMPUSES.map((c) => `'${c}'`).join(
  ", ",
);
