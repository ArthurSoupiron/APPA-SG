import { AGENDA_POLE_LABELS } from "@/app/(authentificated)/account/agenda/_lib/agenda-pole-labels";

import type { ActionPlanCampus, ActionPlanPole, ActionPlanStatus } from "./action-plan-types";

export const ACTION_PLAN_POLES = [
  "crm",
  "marketing",
  "rh",
  "tresorerie",
  "si",
  "operations",
  "presidence",
  "erp",
  "academy",
  "rfp",
] as const satisfies readonly ActionPlanPole[];

export const POLE_LABELS: Record<ActionPlanPole, string> = AGENDA_POLE_LABELS;

export const CAMPUS_OPTIONS: { value: ActionPlanCampus; label: string }[] = [
  { value: "paris", label: "Paris" },
  { value: "lyon", label: "Lyon" },
  { value: "marseille", label: "Marseille" },
];

export const STATUS_OPTIONS: { value: ActionPlanStatus; label: string }[] = [
  { value: "not_started", label: "Non démarré" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
  { value: "blocked", label: "Abandonné" },
];

export const STATUS_COLORS: Record<ActionPlanStatus, string> = {
  not_started: "var(--chart-5)",
  in_progress: "var(--chart-1)",
  done: "var(--chart-2)",
  blocked: "var(--chart-4)",
};
