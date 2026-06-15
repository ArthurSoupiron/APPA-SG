"use client";

import {
  BarChart3,
  Calendar,
  Download,
  LayoutGrid,
  List,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUbacSession } from "@/lib/ubac-client";

import {
  exportActionPlan,
  fetchActionPlanTree,
  importActionPlan,
  updateAction,
  updateSubAction,
} from "../_lib/action-plan-api";
import { ACTION_PLAN_POLES, CAMPUS_OPTIONS, POLE_LABELS } from "../_lib/action-plan-constants";
import type {
  ActionPlanCampus,
  ActionPlanPole,
  ActionPlanStatus,
  ActionPlanTree,
  KanbanCard,
  SelectedTreeNode,
  TreeNodeType,
} from "../_lib/action-plan-types";
import { ActionPlanNodeDialog } from "./dialogs/action-plan-node-dialog";
import { ActionPlanDetailEditor } from "./detail-editor/action-plan-detail-editor";
import { ActionPlanDetailSheet } from "./action-plan-detail-sheet";
import { ProgressBar } from "./action-plan-view-shared";
import { ActionPlanGanttView } from "./gantt/action-plan-gantt-view";
import { ActionPlanKanbanView } from "./kanban/action-plan-kanban-view";
import { ActionPlanKpiView } from "./kpi/action-plan-kpi-view";
import { ActionPlanTreeView } from "./tree/action-plan-tree-view";

const SIDEBAR_KEY = "app.action-plan.treeSidebarExpanded";

type ViewMode = "tree" | "kanban" | "gantt" | "kpi";

function filterByCampus(plan: ActionPlanTree, campus: ActionPlanCampus | "all"): ActionPlanTree {
  if (campus === "all") return plan;
  return plan
    .map((axis) => ({
      ...axis,
      subAxes: axis.subAxes
        .map((subAxis) => ({
          ...subAxis,
          smarts: subAxis.smarts
            .map((smart) => ({
              ...smart,
              actions: smart.actions
                .map((action) => {
                  const filteredSubActions = action.subActions.filter(
                    (s) => s.subAction.campus === campus,
                  );
                  const actionMatches = action.action.campus === campus;
                  if (!actionMatches && filteredSubActions.length === 0) return null;
                  return {
                    ...action,
                    subActions: filteredSubActions,
                  };
                })
                .filter((a): a is NonNullable<typeof a> => a !== null),
            }))
            .filter((s) => s.actions.length > 0),
        }))
        .filter((sa) => sa.smarts.length > 0),
    }))
    .filter((a) => a.subAxes.length > 0);
}

function findNodeData(plan: ActionPlanTree, node: SelectedTreeNode) {
  if (!node) return {};
  for (const axis of plan) {
    if (node.type === "axis" && node.id === axis.axis.id) return { axis: axis.axis };
    for (const subAxis of axis.subAxes) {
      if (node.type === "subAxis" && node.id === subAxis.subAxis.id)
        return { subAxis: subAxis.subAxis };
      for (const smart of subAxis.smarts) {
        if (node.type === "smart" && node.id === smart.smart.id) return { smart: smart.smart };
        for (const action of smart.actions) {
          if (node.type === "action" && node.id === action.action.id)
            return { action: action.action };
          for (const subAction of action.subActions) {
            if (node.type === "subAction" && node.id === subAction.subAction.id)
              return { subAction: subAction.subAction };
          }
        }
      }
    }
  }
  return {};
}

export function ActionPlanView() {
  const { hasPermission } = useUbacSession();
  const canEdit = hasPermission("action_plan.write");
  const canDelete = hasPermission("action_plan.delete");
  const canImportExport = hasPermission("action_plan.manage");

  const [plan, setPlan] = useState<ActionPlanTree>([]);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [campusFilter, setCampusFilter] = useState<ActionPlanCampus | "all">("all");
  const [poleFilter, setPoleFilter] = useState<ActionPlanPole | "all">("all");
  const [axisFilter, setAxisFilter] = useState<string>("all");
  const [subAxisFilter, setSubAxisFilter] = useState<string>("all");
  const [smartFilter, setSmartFilter] = useState<string>("all");

  const [search, setSearch] = useState("");
  const [expandedAxes, setExpandedAxes] = useState<Set<string>>(new Set());
  const [expandedSubAxes, setExpandedSubAxes] = useState<Set<string>>(new Set());
  const [expandedSmarts, setExpandedSmarts] = useState<Set<string>>(new Set());
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<SelectedTreeNode>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    type: TreeNodeType;
    parentId?: string;
  }>({ open: false, type: "axis" });

  const [kanbanUpdatingId, setKanbanUpdatingId] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    const res = await fetchActionPlanTree();
    if (res) {
      setPlan(res.tree);
      setGlobalProgress(res.globalProgress);
      setLastUpdate(new Date());
    }
    setIsRefreshing(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_KEY);
      if (stored !== null) setSidebarExpanded(stored === "true");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const filteredPlan = useMemo(
    () => filterByCampus(plan, campusFilter),
    [plan, campusFilter],
  );

  const filteredPlanForViews = useMemo(() => {
    let result = filteredPlan;
    if (axisFilter !== "all") {
      result = result.filter((axis) => axis.axis.id === axisFilter);
    }
    if (subAxisFilter !== "all") {
      result = result.map((axis) => ({
        ...axis,
        subAxes: axis.subAxes.filter((sa) => sa.subAxis.id === subAxisFilter),
      }));
    }
    if (smartFilter !== "all") {
      result = result.map((axis) => ({
        ...axis,
        subAxes: axis.subAxes.map((sa) => ({
          ...sa,
          smarts: sa.smarts.filter((s) => s.smart.id === smartFilter),
        })),
      }));
    }
    return result;
  }, [filteredPlan, axisFilter, subAxisFilter, smartFilter]);

  const kanbanColumns = useMemo(() => {
    const columns: Record<ActionPlanStatus, KanbanCard[]> = {
      not_started: [],
      in_progress: [],
      done: [],
      blocked: [],
    };

    for (const axis of filteredPlanForViews) {
      for (const subAxis of axis.subAxes) {
        for (const smart of subAxis.smarts) {
          for (const action of smart.actions) {
            if (action.subActions.length === 0) {
              if (poleFilter !== "all" && !action.action.poles.includes(poleFilter)) continue;
              const status = action.action.status ?? "not_started";
              columns[status].push({
                kind: "action",
                id: action.action.id,
                title: action.action.title,
                status,
                progress: action.action.progress,
                owner: action.action.owner,
                campus: action.action.campus,
                poles: action.action.poles,
                axisTitle: axis.axis.title,
                subAxisTitle: subAxis.subAxis.title,
                smartTitle: smart.smart.title,
              });
            } else {
              for (const subAction of action.subActions) {
                if (poleFilter !== "all" && !subAction.subAction.poles.includes(poleFilter))
                  continue;
                const status = subAction.subAction.status ?? "not_started";
                columns[status].push({
                  kind: "subAction",
                  id: subAction.subAction.id,
                  title: subAction.subAction.title,
                  status,
                  progress: subAction.subAction.progress,
                  owner: subAction.subAction.owner,
                  campus: subAction.subAction.campus,
                  poles: subAction.subAction.poles,
                  axisTitle: axis.axis.title,
                  subAxisTitle: subAxis.subAxis.title,
                  smartTitle: smart.smart.title,
                });
              }
            }
          }
        }
      }
    }
    return columns;
  }, [filteredPlanForViews, poleFilter]);

  const handleKanbanStatusDrop = useCallback(
    async (payload: { kind: KanbanCard["kind"]; id: string }, newStatus: ActionPlanStatus) => {
      if (!canEdit) return;
      setKanbanUpdatingId(payload.id);
      try {
        const res =
          payload.kind === "action"
            ? await updateAction(payload.id, { status: newStatus })
            : await updateSubAction(payload.id, { status: newStatus });
        if (!res.success) throw new Error(res.error);
        await refreshData();
      } catch {
        toast.error("Erreur lors du changement de statut.");
      } finally {
        setKanbanUpdatingId(null);
      }
    },
    [canEdit, refreshData],
  );

  const handleExport = async () => {
    const data = await exportActionPlan();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plan-action-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export téléchargé.");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as { tree?: unknown };
        const tree = Array.isArray(parsed.tree) ? parsed.tree : parsed;
        const res = await importActionPlan(tree);
        if (res) {
          setPlan(res.tree);
          setGlobalProgress(res.globalProgress);
          setLastUpdate(new Date());
          toast.success("Import réussi.");
        }
      } catch {
        toast.error("Fichier JSON invalide.");
      }
    };
    input.click();
  };

  const nodeData = findNodeData(plan, selectedNode);

  const taskDetailOpen =
    selectedNode !== null &&
    (selectedNode.type === "action" || selectedNode.type === "subAction") &&
    (viewMode === "kanban" || viewMode === "gantt");

  const handleKanbanCardClick = useCallback((card: KanbanCard) => {
    setSelectedNode({
      id: card.id,
      type: card.kind === "action" ? "action" : "subAction",
    });
  }, []);

  const axisOptions = plan.map((a) => ({ id: a.axis.id, title: a.axis.title }));
  const subAxisOptions = plan.flatMap((a) =>
    a.subAxes.map((sa) => ({ id: sa.subAxis.id, title: sa.subAxis.title })),
  );
  const smartOptions = plan.flatMap((a) =>
    a.subAxes.flatMap((sa) => sa.smarts.map((s) => ({ id: s.smart.id, title: s.smart.title }))),
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement du plan d&apos;action…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg border p-1">
          {(
            [
              { mode: "tree" as const, icon: List, label: "Arbre" },
              { mode: "kanban" as const, icon: LayoutGrid, label: "Kanban" },
              { mode: "gantt" as const, icon: Calendar, label: "Gantt" },
              { mode: "kpi" as const, icon: BarChart3, label: "KPI" },
            ] as const
          ).map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant={viewMode === mode ? "default" : "ghost"}
              onClick={() => {
                setViewMode(mode);
                if (mode === "tree") {
                  setAxisFilter("all");
                  setSubAxisFilter("all");
                  setSmartFilter("all");
                }
              }}
            >
              <Icon className="mr-1 size-4" />
              {label}
            </Button>
          ))}
        </div>

        <Select
          value={campusFilter}
          onValueChange={(v) => setCampusFilter(v as ActionPlanCampus | "all")}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous campus</SelectItem>
            {CAMPUS_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={poleFilter}
          onValueChange={(v) => setPoleFilter(v as ActionPlanPole | "all")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Pôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous pôles</SelectItem>
            {ACTION_PLAN_POLES.map((p) => (
              <SelectItem key={p} value={p}>
                {POLE_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {viewMode !== "tree" && (
          <>
            <Select value={axisFilter} onValueChange={setAxisFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Axe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous axes</SelectItem>
                {axisOptions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={subAxisFilter} onValueChange={setSubAxisFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sous-axe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous sous-axes</SelectItem>
                {subAxisOptions.map((sa) => (
                  <SelectItem key={sa.id} value={sa.id}>
                    {sa.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={smartFilter} onValueChange={setSmartFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="SMART" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous SMART</SelectItem>
                {smartOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void refreshData()}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-1 size-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Actualiser
        </Button>

        {viewMode === "tree" && canImportExport && (
          <>
            <Button type="button" size="sm" variant="outline" onClick={() => void handleExport()}>
              <Download className="mr-1 size-4" />
              Export
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleImport}>
              <Upload className="mr-1 size-4" />
              Import
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>Progression globale : {globalProgress}%</span>
        <div className="w-48">
          <ProgressBar value={globalProgress} />
        </div>
        {lastUpdate && (
          <span>Dernière mise à jour : {lastUpdate.toLocaleString("fr-FR")}</span>
        )}
      </div>

      {viewMode === "tree" && (
        <div className="flex min-h-[480px] gap-0 rounded-lg border">
          <ActionPlanTreeView
            plan={filteredPlan}
            search={search}
            onSearchChange={setSearch}
            expandedAxes={expandedAxes}
            expandedSubAxes={expandedSubAxes}
            expandedSmarts={expandedSmarts}
            expandedActions={expandedActions}
            toggleAxis={(id) =>
              setExpandedAxes((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            toggleSubAxis={(id) =>
              setExpandedSubAxes((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            toggleSmart={(id) =>
              setExpandedSmarts((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            toggleAction={(id) =>
              setExpandedActions((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            canEdit={canEdit}
            onAddAxis={() => setCreateDialog({ open: true, type: "axis" })}
            onAddChild={(type, parentId) => setCreateDialog({ open: true, type, parentId })}
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={toggleSidebar}
          />
          <div className="min-w-0 flex-1 overflow-auto p-4">
            {selectedNode ? (
              <ActionPlanDetailEditor
                key={`${selectedNode.type}-${selectedNode.id}`}
                nodeType={selectedNode.type}
                axis={nodeData.axis}
                subAxis={nodeData.subAxis}
                smart={nodeData.smart}
                action={nodeData.action}
                subAction={nodeData.subAction}
                canEdit={canEdit}
                canDelete={canDelete}
                onUpdated={refreshData}
                onDeleted={async () => {
                  setSelectedNode(null);
                  await refreshData();
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sélectionnez un élément dans l&apos;arbre pour afficher le détail.
              </p>
            )}
          </div>
        </div>
      )}

      {viewMode === "kanban" && (
        <ActionPlanKanbanView
          columns={kanbanColumns}
          canEdit={canEdit}
          kanbanUpdatingId={kanbanUpdatingId}
          onStatusDrop={handleKanbanStatusDrop}
          onCardClick={handleKanbanCardClick}
        />
      )}

      {viewMode === "gantt" && (
        <ActionPlanGanttView
          plan={filteredPlanForViews}
          onSelect={(id, kind) =>
            setSelectedNode({ id, type: kind === "action" ? "action" : "subAction" })
          }
        />
      )}

      <ActionPlanDetailSheet
        open={taskDetailOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedNode(null);
        }}
        nodeType={selectedNode?.type ?? "action"}
        action={nodeData.action}
        subAction={nodeData.subAction}
        canEdit={canEdit}
        canDelete={canDelete}
        onUpdated={refreshData}
        onDeleted={async () => {
          setSelectedNode(null);
          await refreshData();
        }}
      />

      {viewMode === "kpi" && <ActionPlanKpiView plan={filteredPlanForViews} />}

      <ActionPlanNodeDialog
        open={createDialog.open}
        onOpenChange={(open) => setCreateDialog((prev) => ({ ...prev, open }))}
        nodeType={createDialog.type}
        parentId={createDialog.parentId}
        onCreated={refreshData}
      />
    </div>
  );
}
