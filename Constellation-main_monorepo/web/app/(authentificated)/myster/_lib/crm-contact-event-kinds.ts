/** Types d’interaction — alignés sur la contrainte SQL `contact_event.kind`. */

export const CRM_CONTACT_EVENT_KINDS = ["appel", "email", "rdv", "linkedin", "autre"] as const;

export type CrmContactEventKind = (typeof CRM_CONTACT_EVENT_KINDS)[number];

export const CRM_CONTACT_EVENT_KIND_LABELS: Record<CrmContactEventKind, string> = {
  appel: "Appel",
  email: "E-mail",
  rdv: "RDV",
  linkedin: "LinkedIn",
  autre: "Autre",
};

export function isCrmContactEventKind(s: unknown): s is CrmContactEventKind {
  return typeof s === "string" && (CRM_CONTACT_EVENT_KINDS as readonly string[]).includes(s);
}
