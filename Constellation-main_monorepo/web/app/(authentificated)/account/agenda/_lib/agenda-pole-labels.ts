import type { AgendaAudience, AgendaPole, AgendaRsvpStatus } from "./agenda-types";

export const AGENDA_POLE_LABELS: Record<AgendaPole, string> = {
  crm: "CRM / Myster",
  marketing: "Marketing",
  rh: "RH",
  tresorerie: "Trésorerie",
  si: "SI",
  operations: "Jaeger",
  presidence: "Présidence",
  erp: "ERP",
  academy: "Academy",
  rfp: "RFP",
};

export const AGENDA_AUDIENCE_LABELS: Record<AgendaAudience, string> = {
  mandat: "Mandat (@jeece.fr)",
  intervenants: "Intervenants",
  externes: "Externes",
};

export const AGENDA_STATUS_LABELS = {
  draft: "Brouillon",
  published: "Publié",
  cancelled: "Annulé",
} as const;

/** Valeur sentinelle — Radix Select interdit `value=""`. */
export const AGENDA_RECURRENCE_NONE = "__none__";

export function formatAgendaAudienceGroup(g: { name: string | null; email: string }) {
  return g.name ? `${g.name} (${g.email})` : g.email;
}

export const AGENDA_RSVP_LABELS: Record<AgendaRsvpStatus, string> = {
  accepted: "Accepté",
  declined: "Refusé",
  tentative: "Peut-être",
  pending: "En attente",
};

export function formatAgendaEventRange(
  startsAt: string,
  endsAt: string,
  allDay: boolean,
  compact = false,
) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateStyle = compact ? "medium" : "full";
  const dateOpts: Intl.DateTimeFormatOptions = { dateStyle };
  const dateTimeOpts: Intl.DateTimeFormatOptions = {
    dateStyle,
    timeStyle: "short",
  };
  if (allDay) {
    const startStr = start.toLocaleDateString("fr-FR", dateOpts);
    const endStr = end.toLocaleDateString("fr-FR", dateOpts);
    return startStr === endStr ? startStr : `${startStr} → ${endStr}`;
  }
  return `${start.toLocaleString("fr-FR", dateTimeOpts)} → ${end.toLocaleString("fr-FR", { timeStyle: "short" })}`;
}

export const AGENDA_RECURRENCE_PRESETS: { label: string; value: string }[] = [
  { label: "Aucune", value: AGENDA_RECURRENCE_NONE },
  { label: "Hebdomadaire", value: "FREQ=WEEKLY;INTERVAL=1" },
  { label: "Toutes les 2 semaines", value: "FREQ=WEEKLY;INTERVAL=2" },
  { label: "Mensuelle", value: "FREQ=MONTHLY;INTERVAL=1" },
];
