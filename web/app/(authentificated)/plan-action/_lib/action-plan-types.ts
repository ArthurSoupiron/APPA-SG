export type ActionPlanStatus = "not_started" | "in_progress" | "done" | "blocked";
export type ActionPlanCampus = "paris" | "lyon" | "marseille";
export type ActionPlanPole =
  | "crm"
  | "marketing"
  | "rh"
  | "tresorerie"
  | "si"
  | "operations"
  | "presidence"
  | "erp"
  | "academy"
  | "rfp";

export type ActionPlanAxis = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ActionPlanSubAxis = {
  id: string;
  axisId: string;
  title: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ActionPlanSmart = {
  id: string;
  subAxisId: string;
  title: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ActionPlanAction = {
  id: string;
  smartId: string;
  title: string;
  description: string;
  owner: string | null;
  status: ActionPlanStatus;
  progress: number;
  priority: number | null;
  sortOrder: number;
  startDate: string | null;
  dueDate: string | null;
  campus: ActionPlanCampus | null;
  createdAt: string;
  updatedAt: string;
  poles: string[];
};

export type ActionPlanSubAction = {
  id: string;
  actionId: string;
  title: string;
  description: string;
  owner: string | null;
  status: ActionPlanStatus;
  progress: number;
  priority: number | null;
  sortOrder: number;
  startDate: string | null;
  dueDate: string | null;
  campus: ActionPlanCampus | null;
  createdAt: string;
  updatedAt: string;
  poles: string[];
};

export type SubActionNode = { subAction: ActionPlanSubAction };
export type ActionNode = { action: ActionPlanAction; subActions: SubActionNode[] };
export type SmartNode = { smart: ActionPlanSmart; progress: number; actions: ActionNode[] };
export type SubAxisNode = {
  subAxis: ActionPlanSubAxis;
  progress: number;
  smarts: SmartNode[];
};
export type AxisNode = { axis: ActionPlanAxis; progress: number; subAxes: SubAxisNode[] };

export type ActionPlanTree = AxisNode[];

export type ActionPlanTreeResponse = {
  tree: ActionPlanTree;
  globalProgress: number;
};

export type TreeNodeType = "axis" | "subAxis" | "smart" | "action" | "subAction";

export type SelectedTreeNode = { id: string; type: TreeNodeType } | null;

export type KanbanCardKind = "action" | "subAction";

export type KanbanCard = {
  kind: KanbanCardKind;
  id: string;
  title: string;
  status: ActionPlanStatus;
  progress: number;
  owner: string | null;
  campus: ActionPlanCampus | null;
  poles: string[];
  axisTitle: string;
  subAxisTitle: string;
  smartTitle: string;
};
