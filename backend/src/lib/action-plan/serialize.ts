import type {
  actionPlanAction,
  actionPlanAxis,
  actionPlanSmart,
  actionPlanSubAction,
  actionPlanSubAxis,
} from "../../db/schema";

type ActionPlanAxis = typeof actionPlanAxis.$inferSelect;
type ActionPlanSubAxis = typeof actionPlanSubAxis.$inferSelect;
type ActionPlanSmart = typeof actionPlanSmart.$inferSelect;
type ActionPlanAction = typeof actionPlanAction.$inferSelect;
type ActionPlanSubAction = typeof actionPlanSubAction.$inferSelect;

function isoDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString();
}

export type SerializedAxis = Omit<ActionPlanAxis, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializedSubAxis = Omit<ActionPlanSubAxis, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializedSmart = Omit<ActionPlanSmart, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializedAction = Omit<
  ActionPlanAction,
  "createdAt" | "updatedAt" | "startDate" | "dueDate"
> & {
  createdAt: string;
  updatedAt: string;
  startDate: string | null;
  dueDate: string | null;
  poles: string[];
};

export type SerializedSubAction = Omit<
  ActionPlanSubAction,
  "createdAt" | "updatedAt" | "startDate" | "dueDate"
> & {
  createdAt: string;
  updatedAt: string;
  startDate: string | null;
  dueDate: string | null;
  poles: string[];
};

export type SerializedSubActionNode = {
  subAction: SerializedSubAction;
};

export type SerializedActionNode = {
  action: SerializedAction;
  subActions: SerializedSubActionNode[];
};

export type SerializedSmartNode = {
  smart: SerializedSmart;
  progress: number;
  actions: SerializedActionNode[];
};

export type SerializedSubAxisNode = {
  subAxis: SerializedSubAxis;
  progress: number;
  smarts: SerializedSmartNode[];
};

export type SerializedAxisNode = {
  axis: SerializedAxis;
  progress: number;
  subAxes: SerializedSubAxisNode[];
};

export type ActionPlanTreeResponse = {
  tree: SerializedAxisNode[];
  globalProgress: number;
};

export function serializeAxis(row: ActionPlanAxis): SerializedAxis {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeSubAxis(row: ActionPlanSubAxis): SerializedSubAxis {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeSmart(row: ActionPlanSmart): SerializedSmart {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeAction(
  row: ActionPlanAction,
  poles: string[],
): SerializedAction {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    startDate: isoDate(row.startDate),
    dueDate: isoDate(row.dueDate),
    poles,
  };
}

export function serializeSubAction(
  row: ActionPlanSubAction,
  poles: string[],
): SerializedSubAction {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    startDate: isoDate(row.startDate),
    dueDate: isoDate(row.dueDate),
    poles,
  };
}
