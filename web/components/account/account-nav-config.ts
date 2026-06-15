export type NavIconKey =
  | "dashboard"
  | "account"
  | "agenda"
  | "monDrive"
  | "contacts"
  | "activities"
  | "shield"
  | "workspace"
  | "jaeger"
  | "myster"
  | "marketing"
  | "cdm"
  | "rdi"
  | "sg"
  | "tresorerie"
  | "si"
  | "actionPlan";

export type NavItem = {
  title: string;
  /** Libellé secondaire affiché sous le titre (ex. acronyme ou rôle métier). */
  subtitle?: string;
  href: string;
  disabled?: boolean;
  iconKey?: NavIconKey;
  /** UBAC : chaîne connue du backend (`ubac.ts`), comparée à `GET /session`.permissions */
  permission?: string;
  /** Visible si au moins une de ces permissions est accordée. */
  permissionAnyOf?: string[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const ACCOUNT_NAV_SECTIONS: NavSection[] = [
  {
    label: "Vue d'ensemble",
    items: [
      {
        title: "Tableau de bord",
        href: "/dashboard",
        iconKey: "dashboard",
        permissionAnyOf: ["app.overview", "agenda.read"],
      },
      {
        title: "Compte",
        href: "/account",
        iconKey: "account",
      },
    ],
  },
  {
    label: "Commercial",
    items: [
      {
        title: "Jaeger",
        subtitle: "Gestionnaire de missions",
        href: "/jaeger",
        iconKey: "jaeger",
        permission: "erp.read",
      },
      {
        title: "Myster",
        subtitle: "CRM",
        href: "/myster/dashboard",
        iconKey: "myster",
        permission: "crm.read",
      },
      {
        title: "Marketing",
        subtitle: "Communication",
        href: "/marketing",
        iconKey: "marketing",
        permission: "marketing.read",
      },
    ],
  },
  {
    label: "RH",
    items: [
      {
        title: "App RH",
        subtitle: "Gestion RH (CDM)",
        href: "/rh/cdm",
        iconKey: "cdm",
        permission: "rh.read",
      },
      {
        title: "Gestion Intervenant",
        subtitle: "RDI",
        href: "/rh/intervenants",
        iconKey: "rdi",
        permission: "rh.read",
      },
      {
        title: "Gestion Associative",
        subtitle: "SG",
        href: "/rh/associatif",
        iconKey: "sg",
        permission: "rh.read",
      },
    ],
  },
  {
    label: "Pilotage",
    items: [
      {
        title: "Trésorerie",
        href: "/tresorerie",
        iconKey: "tresorerie",
        permission: "tresorerie.read",
      },
      {
        title: "SI",
        href: "/si",
        iconKey: "si",
        permissionAnyOf: ["si.ticket.manage", "si.registres.read"],
      },
      {
        title: "Plan d'action",
        href: "/plan-action",
        iconKey: "actionPlan",
        permission: "action_plan.read",
      },
    ],
  },
];

/** Visible uniquement si `isSuperAdmin` (côté UI ; l’API reste protégée serveur). */
export const SUPERADMIN_NAV_SECTION: NavSection = {
  label: "Administration",
  items: [
    {
      title: "Membres",
      href: "/account/admin/ubac",
      iconKey: "shield",
    },
    {
      title: "Google Workspace",
      href: "/account/admin/workspace",
      iconKey: "workspace",
    },
    {
      title: "Authentification",
      href: "/account/admin/auth",
      iconKey: "shield",
    },
  ],
};
