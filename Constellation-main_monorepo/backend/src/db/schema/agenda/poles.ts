/** Pôles sources d’événements (alignés nav + UBAC). */
export const AGENDA_POLES = [
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
] as const;

export type AgendaPole = (typeof AGENDA_POLES)[number];

export const AGENDA_POLE_SQL = AGENDA_POLES.map((p) => `'${p}'`).join(", ");

export const AGENDA_AUDIENCES = ["mandat", "intervenants", "externes"] as const;
export type AgendaAudience = (typeof AGENDA_AUDIENCES)[number];

export const AGENDA_AUDIENCE_SQL = AGENDA_AUDIENCES.map((a) => `'${a}'`).join(
  ", ",
);

export const AGENDA_EVENT_STATUSES = [
  "draft",
  "published",
  "cancelled",
] as const;
export type AgendaEventStatus = (typeof AGENDA_EVENT_STATUSES)[number];

export const AGENDA_RSVP_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "tentative",
] as const;
export type AgendaRsvpStatus = (typeof AGENDA_RSVP_STATUSES)[number];

export const AGENDA_PARTICIPANT_ROLES = ["organizer", "attendee"] as const;
export type AgendaParticipantRole = (typeof AGENDA_PARTICIPANT_ROLES)[number];
