/** Statuts prospect — alignés sur le backend (`PROSPECT_STATUSES`). */

export const CRM_PROSPECT_STATUSES = [
  "a_contacter",
  "a_recontacter",
  "contacte",
  "rdv_confirme",
  "en_cours",
  "transforme",
  "perdu",
] as const;

export type CrmProspectStatut = (typeof CRM_PROSPECT_STATUSES)[number];

export const CRM_PROSPECT_STATUT_LABELS: Record<CrmProspectStatut, string> = {
  a_contacter: "À contacter",
  a_recontacter: "À recontacter",
  contacte: "Contacté",
  rdv_confirme: "RDV confirmé",
  en_cours: "En cours",
  transforme: "Transformé",
  perdu: "Perdu",
};

/** Accents de ligne — couleurs du thème (`globals.css` → @theme). */
export const CRM_STATUT_ROW_ACCENT: Record<string, string> = {
  a_contacter: "border-l-muted-foreground",
  a_recontacter: "border-l-primary",
  contacte: "border-l-chart-2",
  rdv_confirme: "border-l-chart-4",
  en_cours: "border-l-chart-3",
  transforme: "border-l-brand",
  perdu: "border-l-destructive",
};

/** Badges lisibles clair / sombre via tokens sémantiques uniquement. */
export const CRM_STATUT_BADGE_CLASS: Record<string, string> = {
  a_contacter: "border-border bg-muted text-foreground",
  a_recontacter: "border-primary/40 bg-primary/10 text-foreground",
  contacte: "border-chart-2/45 bg-chart-2/10 text-foreground",
  rdv_confirme: "border-chart-4/45 bg-chart-4/10 text-foreground",
  en_cours: "border-chart-3/45 bg-chart-3/10 text-foreground",
  transforme: "border-brand/40 bg-brand/10 text-foreground",
  perdu: "border-destructive/45 bg-destructive/10 text-destructive",
};

export function isCrmProspectStatut(s: string): s is CrmProspectStatut {
  return (CRM_PROSPECT_STATUSES as readonly string[]).includes(s);
}
