import type { SiTicketStatus } from "../../db/schema/si/ticket";

export const SI_TICKET_STATUS_LABELS: Record<SiTicketStatus, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
  closed: "Fermé",
  cancelled: "Annulé",
};

const AGENT_TRANSITIONS: Record<SiTicketStatus, SiTicketStatus[]> = {
  open: ["in_progress", "cancelled"],
  in_progress: ["resolved", "open", "cancelled"],
  resolved: ["closed", "in_progress"],
  closed: ["open"],
  cancelled: [],
};

export function canAgentTransition(from: SiTicketStatus, to: SiTicketStatus): boolean {
  return AGENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTicketTerminal(status: SiTicketStatus): boolean {
  return status === "closed" || status === "cancelled";
}

export function canParticipantInteract(status: SiTicketStatus): boolean {
  return !isTicketTerminal(status);
}
