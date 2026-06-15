export type PermissionCatalogEntry = {
  id: string;
  groupKey: string;
  groupLabel: string;
  subGroupKey: string | null;
  subGroupLabel: string | null;
  actionLabel: string;
  fullLabel: string;
};

export type PermissionAdminSection = {
  groupKey: string;
  groupLabel: string;
  subGroups: {
    subGroupKey: string | null;
    subGroupLabel: string | null;
    entries: PermissionCatalogEntry[];
  }[];
};

export type UbacCatalogResponse = {
  permissions?: string[];
  catalog?: PermissionCatalogEntry[];
  sections?: PermissionAdminSection[];
};
