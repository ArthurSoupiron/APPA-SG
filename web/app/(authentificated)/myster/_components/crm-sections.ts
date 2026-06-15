export const CRM_SECTION_IDS = ["vue", "kpi-global", "kpi-me", "contacts", "sprints"] as const;

export type CrmSectionId = (typeof CRM_SECTION_IDS)[number];

export type CrmNavItem = {
  id: CrmSectionId;
  label: string;
  hint: string;
  permission: string;
};

export const CRM_NAV_ITEMS: CrmNavItem[] = [
  {
    id: "vue",
    label: "Vue globale",
    hint: "Tendances & répartition",
    permission: "crm.kpi.global",
  },
  {
    id: "kpi-global",
    label: "KPI & équipe",
    hint: "Totaux & classement",
    permission: "crm.kpi.global",
  },
  {
    id: "kpi-me",
    label: "Mes KPI",
    hint: "Vos assignations sprint",
    permission: "crm.kpi.read",
  },
  {
    id: "contacts",
    label: "Base prospects",
    hint: "Fiches & imports",
    permission: "crm.read",
  },
  {
    id: "sprints",
    label: "Sprints",
    hint: "Campagnes",
    permission: "crm.read",
  },
];

/** Dérivé de `CRM_NAV_ITEMS` : une seule source de vérité pour l’entrée app Myster. */
export const CRM_APP_ENTRY_PERMISSIONS: readonly string[] = [
  ...new Set(CRM_NAV_ITEMS.map((i) => i.permission)),
];

export function isCrmSectionId(v: string | null): v is CrmSectionId {
  return v !== null && (CRM_SECTION_IDS as readonly string[]).includes(v);
}
