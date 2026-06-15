import type { SiTicketStatus } from "./si-ticket-types";

export const SI_TICKET_STATUS_LABELS: Record<SiTicketStatus, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
  closed: "Fermé",
  cancelled: "Annulé",
};

export const SI_TICKET_STATUS_BADGE_CLASS: Record<SiTicketStatus, string> = {
  open: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
  in_progress: "bg-amber-500/15 text-amber-900 dark:text-amber-100",
  resolved: "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100",
  closed: "bg-stone-500/15 text-stone-800 dark:text-stone-200",
  cancelled: "bg-rose-500/15 text-rose-900 dark:text-rose-100",
};

export const SI_TICKET_CATEGORY_LABELS = {
  bug: "Bug",
  acces: "Accès",
  demande: "Demande",
  autre: "Autre",
} as const;

export const SI_TICKET_STATUSES: SiTicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
  "cancelled",
];

export const AGENT_STATUS_OPTIONS: SiTicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
  "cancelled",
];
