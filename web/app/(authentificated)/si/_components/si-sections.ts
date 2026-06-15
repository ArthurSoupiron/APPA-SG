export const SI_NAV_ITEMS = [
  {
    id: "tickets",
    label: "Tickets",
    hint: "Gestion des tickets support interne.",
    permission: "si.ticket.manage",
  },
  {
    id: "registres",
    label: "Registres & conformité",
    hint: "Registres S.I., traitements de données et droits RGPD.",
    permission: "si.registres.read",
  },
] as const;

export type SiSectionId = (typeof SI_NAV_ITEMS)[number]["id"];
export type SiNavItem = (typeof SI_NAV_ITEMS)[number];
