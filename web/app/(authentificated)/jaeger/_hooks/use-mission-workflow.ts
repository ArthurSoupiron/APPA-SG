"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  assignDesignationIntervenant,
  fetchIntervenantOptions,
  fetchMissionDocsMatrix,
  fetchWorkflowState,
} from "../_lib/missions-api";
import { formatBcDisplayLabel } from "../_lib/format-bc-label";
import type {
  GestionnaireMissionsPermissions,
  MissionBcDocsMatrixRow,
  MissionDocsMatrix,
  MissionMissionLevelDocs,
} from "../_lib/missions-types";
import {
  workflowDocsMatrixCache,
  workflowStateCache,
} from "../_lib/workflow-client-cache";

export type WorkflowPrefetchedDocsMatrix = {
  mission: MissionMissionLevelDocs | null;
  rows: MissionBcDocsMatrixRow[];
  expectedBcCount: number;
};

function isPrefetchDocsMatrixComplete(
  expectedBcCount: number,
  rows: MissionBcDocsMatrixRow[],
): boolean {
  if (expectedBcCount === 0) return rows.length === 0;
  return rows.length === expectedBcCount;
}

function trySeedWorkflowDocsMatrixCache(
  missionId: string,
  prefetched: WorkflowPrefetchedDocsMatrix | undefined,
): MissionDocsMatrix | null {
  if (!prefetched) return null;
  if (!isPrefetchDocsMatrixComplete(prefetched.expectedBcCount, prefetched.rows)) {
    return null;
  }
  if (!prefetched.mission) return null;
  const matrix: MissionDocsMatrix = {
    mission: prefetched.mission,
    rows: prefetched.rows,
  };
  workflowDocsMatrixCache.set(missionId, matrix);
  return matrix;
}

function getInitialWorkflowMatrix(
  missionId: string,
  prefetched: WorkflowPrefetchedDocsMatrix | undefined,
): MissionDocsMatrix | null {
  const cached = workflowDocsMatrixCache.get(missionId);
  if (cached) return cached;
  return trySeedWorkflowDocsMatrixCache(missionId, prefetched);
}

export type UseMissionWorkflowOptions = {
  missionId: string;
  permissions: GestionnaireMissionsPermissions;
  actionRequest?: "create-bc" | "focus-events" | null;
  selectedBcIdRequest?: string | null;
  onActionConsumed?: () => void;
  prefetchedDocsMatrix?: WorkflowPrefetchedDocsMatrix;
  onBcListReady?: (bcList: Array<{ id: string; label: string }>) => void;
  initialIntervenantOptions?: Array<{ id: string; label: string }>;
};

export function useMissionWorkflow({
  missionId,
  permissions,
  actionRequest,
  selectedBcIdRequest,
  onActionConsumed,
  prefetchedDocsMatrix,
  onBcListReady,
  initialIntervenantOptions,
}: UseMissionWorkflowOptions) {
  const queryClient = useQueryClient();
  const [selectedBcId, setSelectedBcId] = useState<string | null>(null);
  const [isBcDialogOpen, setIsBcDialogOpen] = useState(false);
  const [editingBcId, setEditingBcId] = useState<string | null>(null);

  const initialMatrix = getInitialWorkflowMatrix(missionId, prefetchedDocsMatrix);
  if (initialMatrix) {
    workflowDocsMatrixCache.set(missionId, initialMatrix);
  }

  const workflowQuery = useQuery({
    queryKey: ["mission-workflow", missionId],
    queryFn: async () => {
      const cached = workflowStateCache.get(missionId);
      if (cached) return cached;
      const ws = await fetchWorkflowState(missionId);
      if (!ws) throw new Error("Workflow indisponible.");
      workflowStateCache.set(missionId, ws);
      return ws;
    },
  });

  const matrixQuery = useQuery({
    queryKey: ["mission-docs-matrix", missionId],
    queryFn: async () => {
      const cached = workflowDocsMatrixCache.get(missionId);
      if (cached) return cached;
      const matrix = await fetchMissionDocsMatrix(missionId);
      if (!matrix) throw new Error("Matrice documents indisponible.");
      workflowDocsMatrixCache.set(missionId, matrix);
      return matrix;
    },
    initialData: initialMatrix ?? undefined,
  });

  const intervenantQuery = useQuery({
    queryKey: ["mission-intervenants"],
    queryFn: fetchIntervenantOptions,
    enabled: !initialIntervenantOptions?.length,
    initialData: initialIntervenantOptions,
  });

  const workflowState = workflowQuery.data ?? null;
  const docsMatrixRows = matrixQuery.data?.rows ?? [];
  const missionLevelDocs = matrixQuery.data?.mission ?? null;
  const intervenantOptions = intervenantQuery.data ?? [];

  const effectiveSelectedBcId = selectedBcIdRequest ?? selectedBcId;

  useEffect(() => {
    if (!workflowState) return;
    onBcListReady?.(
      workflowState.bcs.map((item) => ({
        id: item.bc.id,
        label: formatBcDisplayLabel(item.bc.type, item.bc.bcNumber),
      })),
    );
    if (workflowState.bcs.length > 0 && !selectedBcId && !selectedBcIdRequest) {
      setSelectedBcId(workflowState.bcs[0].bc.id);
    }
  }, [workflowState, onBcListReady, selectedBcId, selectedBcIdRequest]);

  useEffect(() => {
    if (!actionRequest) return;
    if (!permissions.canManageBcStructure) {
      onActionConsumed?.();
      return;
    }
    if (actionRequest === "create-bc") {
      setEditingBcId(null);
      setIsBcDialogOpen(true);
    }
    onActionConsumed?.();
  }, [actionRequest, onActionConsumed, permissions.canManageBcStructure]);

  const selectedBcState = useMemo(
    () => workflowState?.bcs.find((b) => b.bc.id === effectiveSelectedBcId) ?? null,
    [workflowState, effectiveSelectedBcId],
  );

  const selectedBcMatrixRow = useMemo(
    () => docsMatrixRows.find((row) => row.bcId === effectiveSelectedBcId) ?? null,
    [docsMatrixRows, effectiveSelectedBcId],
  );

  const suggestedBcNumber = `BC${String((workflowState?.bcs.length ?? 0) + 1).padStart(2, "0")}`;

  const loadData = useCallback(
    (force = false) => {
      if (force) {
        workflowStateCache.delete(missionId);
        workflowDocsMatrixCache.delete(missionId);
      }
      void queryClient.invalidateQueries({ queryKey: ["mission-workflow", missionId] });
      void queryClient.invalidateQueries({ queryKey: ["mission-docs-matrix", missionId] });
    },
    [missionId, queryClient],
  );

  return {
    workflowState,
    selectedBcId,
    setSelectedBcId,
    isBcDialogOpen,
    setIsBcDialogOpen,
    editingBcId,
    setEditingBcId,
    intervenantOptions,
    docsMatrixRows,
    missionLevelDocs,
    effectiveSelectedBcId,
    selectedBcState,
    selectedBcMatrixRow,
    suggestedBcNumber,
    loadData,
    isLoading: workflowQuery.isLoading || matrixQuery.isLoading,
  };
}
