import { AGENDA_POLES } from "./db/schema/agenda/poles";
import type { Permission } from "./ubac";
import { PERMISSIONS } from "./ubac";

const POLE_SET = new Set<string>(AGENDA_POLES);

export type PermissionCatalogEntry = {
  id: Permission;
  groupKey: string;
  groupLabel: string;
  subGroupKey: string | null;
  subGroupLabel: string | null;
  actionLabel: string;
  fullLabel: string;
};

const GROUP_ORDER = [
  "app",
  "crm",
  "marketing",
  "rh",
  "tresorerie",
  "si",
  "presidence",
  "erp",
  "operations",
  "academy",
  "rfp",
  "action_plan",
  "agenda",
] as const;

const TOOL_LABELS: Record<string, string> = {
  app: "Application",
  agenda: "Agenda",
  erp: "Jaeger ERP",
  crm: "CRM / Myster",
  marketing: "Marketing",
  academy: "Academy",
  rfp: "RFP",
  si: "SI",
  presidence: "Présidence",
  action_plan: "Plan d'action",
  tresorerie: "Trésorerie",
  rh: "RH",
};

const POLE_LABELS: Record<string, string> = {
  crm: "CRM / Myster",
  marketing: "Marketing",
  rh: "RH",
  tresorerie: "Trésorerie",
  si: "SI",
  operations: "Jaeger",
  presidence: "Présidence",
  erp: "Jaeger ERP",
  academy: "Academy",
  rfp: "RFP",
};

const SUBGROUP_LABELS: Record<string, string> = {
  agenda: "Agenda",
  sprint: "Sprints",
  kpi: "KPI",
  mission: "Missions",
  integration: "Intégrations",
  slack: "Slack",
  config: "Configuration",
  templates: "Templates",
  doc: "Documents",
  ticket: "Tickets",
  registres: "Registres",
};

const ACTION_LABELS: Record<string, string> = {
  read: "Lecture",
  write: "Écriture",
  delete: "Suppression",
  manage: "Gestion",
  create: "Création",
  join: "Participation",
  sync: "Synchronisation",
  global: "Vue globale",
  overview: "Vue d'ensemble",
  concours: "Concours",
  operations: "Opérations",
};

const ERP_DOC_LABELS: Record<string, string> = {
  cca: "CCA",
  bc: "BC",
  bcr: "BCR",
  rmi: "RMI",
  armi: "ARMI",
  pvrf: "PVRF",
};

function labelAction(parts: string[]): string {
  if (parts.length === 0) return parts.join(".");
  if (parts[0] === "doc" && parts[1] === "generate" && parts[2]) {
    return `Génération ${ERP_DOC_LABELS[parts[2]] ?? parts[2].toUpperCase()}`;
  }
  if (parts[0] === "doc" && parts[1] === "validate" && parts[2]) {
    return `Validation ${ERP_DOC_LABELS[parts[2]] ?? parts[2].toUpperCase()}`;
  }
  const key = parts.join(".");
  return ACTION_LABELS[key] ?? ACTION_LABELS[parts.at(-1)!] ?? key;
}

function groupLabelFor(key: string): string {
  return POLE_LABELS[key] ?? TOOL_LABELS[key] ?? key;
}

export function describePermission(id: Permission): PermissionCatalogEntry {
  const parts = id.split(".");

  if (parts.length === 3 && parts[1] === "agenda" && POLE_SET.has(parts[0]!)) {
    const [pole, , action] = parts;
    const subGroupLabel = SUBGROUP_LABELS.agenda ?? "Agenda";
    const actionLabel = labelAction([action!]);
    const groupLabel = groupLabelFor(pole!);
    return {
      id,
      groupKey: pole!,
      groupLabel,
      subGroupKey: "agenda",
      subGroupLabel,
      actionLabel,
      fullLabel: `${groupLabel} · ${subGroupLabel} · ${actionLabel}`,
    };
  }

  if (parts.length === 2 && parts[0] === "agenda") {
    const actionLabel = labelAction([parts[1]!]);
    return {
      id,
      groupKey: "agenda",
      groupLabel: TOOL_LABELS.agenda ?? "Agenda",
      subGroupKey: null,
      subGroupLabel: null,
      actionLabel,
      fullLabel: `${TOOL_LABELS.agenda ?? "Agenda"} · ${actionLabel}`,
    };
  }

  const tool = parts[0]!;
  const groupLabel = groupLabelFor(tool);

  if (parts.length === 2) {
    const actionLabel = labelAction([parts[1]!]);
    return {
      id,
      groupKey: tool,
      groupLabel,
      subGroupKey: null,
      subGroupLabel: null,
      actionLabel,
      fullLabel: `${groupLabel} · ${actionLabel}`,
    };
  }

  if (parts.length === 3) {
    const subKey = parts[1]!;
    const subGroupLabel = SUBGROUP_LABELS[subKey] ?? subKey;
    const actionLabel = labelAction([parts[2]!]);
    return {
      id,
      groupKey: tool,
      groupLabel,
      subGroupKey: subKey,
      subGroupLabel,
      actionLabel,
      fullLabel: `${groupLabel} · ${subGroupLabel} · ${actionLabel}`,
    };
  }

  if (parts.length === 4 && parts[1] === "doc") {
    const subGroupLabel = SUBGROUP_LABELS.doc ?? "Documents";
    const actionLabel = labelAction(parts.slice(1));
    return {
      id,
      groupKey: tool,
      groupLabel,
      subGroupKey: "doc",
      subGroupLabel,
      actionLabel,
      fullLabel: `${groupLabel} · ${subGroupLabel} · ${actionLabel}`,
    };
  }

  const actionLabel = labelAction(parts.slice(1));
  return {
    id,
    groupKey: tool,
    groupLabel,
    subGroupKey: parts[1] ?? null,
    subGroupLabel: parts[1] ? (SUBGROUP_LABELS[parts[1]] ?? parts[1]) : null,
    actionLabel,
    fullLabel: `${groupLabel} · ${actionLabel}`,
  };
}

export type PermissionAdminSection = {
  groupKey: string;
  groupLabel: string;
  subGroups: {
    subGroupKey: string | null;
    subGroupLabel: string | null;
    entries: PermissionCatalogEntry[];
  }[];
};

function groupSortIndex(key: string): number {
  const i = GROUP_ORDER.indexOf(key as (typeof GROUP_ORDER)[number]);
  return i === -1 ? GROUP_ORDER.length : i;
}

export function buildPermissionAdminSections(
  permissions: readonly Permission[] = PERMISSIONS,
): PermissionAdminSection[] {
  const byGroup = new Map<string, PermissionCatalogEntry[]>();
  for (const id of permissions) {
    const entry = describePermission(id);
    const list = byGroup.get(entry.groupKey) ?? [];
    list.push(entry);
    byGroup.set(entry.groupKey, list);
  }

  return [...byGroup.entries()]
    .sort(([a], [b]) => groupSortIndex(a) - groupSortIndex(b) || a.localeCompare(b))
    .map(([groupKey, entries]) => {
      const subMap = new Map<string | null, PermissionCatalogEntry[]>();
      for (const e of entries) {
        const list = subMap.get(e.subGroupKey) ?? [];
        list.push(e);
        subMap.set(e.subGroupKey, list);
      }
      const subGroups = [...subMap.entries()]
        .sort(([a], [b]) => {
          if (a === null) return -1;
          if (b === null) return 1;
          return a.localeCompare(b);
        })
        .map(([subGroupKey, subEntries]) => ({
          subGroupKey,
          subGroupLabel: subEntries[0]?.subGroupLabel ?? null,
          entries: subEntries.sort((x, y) => x.actionLabel.localeCompare(y.actionLabel, "fr")),
        }));

      return {
        groupKey,
        groupLabel: entries[0]?.groupLabel ?? groupKey,
        subGroups,
      };
    });
}

export function permissionCatalogEntries(): PermissionCatalogEntry[] {
  return PERMISSIONS.map(describePermission);
}

/** Ancien format agenda.{pole}.{action} → {pole}.agenda.{action} */
export const LEGACY_AGENDA_POLE_PERMISSION_MAP: Record<string, Permission> = Object.fromEntries(
  AGENDA_POLES.flatMap((pole) =>
    (["write", "manage", "delete"] as const).map((action) => [
      `agenda.${pole}.${action}`,
      `${pole}.agenda.${action}` as Permission,
    ]),
  ),
);
