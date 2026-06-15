import type { MissionDocsMatrix, MissionWorkflowState } from "./missions-types";

export const workflowStateCache = new Map<string, MissionWorkflowState>();
export const workflowDocsMatrixCache = new Map<string, MissionDocsMatrix>();
