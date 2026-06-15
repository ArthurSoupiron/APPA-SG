"use client";

import { ChevronDown, ChevronRight, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type {
  ActionPlanTree,
  SelectedTreeNode,
  TreeNodeType,
} from "../../_lib/action-plan-types";

type TreeViewProps = {
  plan: ActionPlanTree;
  search: string;
  onSearchChange: (v: string) => void;
  expandedAxes: Set<string>;
  expandedSubAxes: Set<string>;
  expandedSmarts: Set<string>;
  expandedActions: Set<string>;
  toggleAxis: (id: string) => void;
  toggleSubAxis: (id: string) => void;
  toggleSmart: (id: string) => void;
  toggleAction: (id: string) => void;
  selectedNode: SelectedTreeNode;
  onSelectNode: (node: SelectedTreeNode) => void;
  canEdit: boolean;
  onAddAxis: () => void;
  onAddChild: (type: TreeNodeType, parentId: string) => void;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
};

function matchesSearch(text: string, q: string): boolean {
  if (!q) return true;
  return text.toLowerCase().includes(q.toLowerCase());
}

export function ActionPlanTreeView({
  plan,
  search,
  onSearchChange,
  expandedAxes,
  expandedSubAxes,
  expandedSmarts,
  expandedActions,
  toggleAxis,
  toggleSubAxis,
  toggleSmart,
  toggleAction,
  selectedNode,
  onSelectNode,
  canEdit,
  onAddAxis,
  onAddChild,
  sidebarExpanded,
  onToggleSidebar,
}: TreeViewProps) {
  const q = search.trim();

  return (
    <div
      className={cn(
        "shrink-0 border-r transition-all",
        sidebarExpanded ? "w-[380px]" : "w-10",
      )}
    >
        <div className="flex items-center gap-2 border-b p-2">
          <Button type="button" size="icon" variant="ghost" onClick={onToggleSidebar}>
            {sidebarExpanded ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4 rotate-[-90deg]" />}
          </Button>
          {sidebarExpanded && (
            <>
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              {canEdit && (
                <Button type="button" size="sm" variant="outline" onClick={onAddAxis}>
                  <Plus className="mr-1 size-4" />
                  Axe
                </Button>
              )}
            </>
          )}
        </div>
        {sidebarExpanded && (
          <ScrollArea className="h-[calc(480px-3rem)]">
            <div className="space-y-1 p-2">
              {plan.map((axisNode) => {
                if (!matchesSearch(axisNode.axis.title, q) && !matchesSearch(axisNode.axis.description, q)) {
                  const hasChildMatch = axisNode.subAxes.some(
                    (sa) =>
                      matchesSearch(sa.subAxis.title, q) ||
                      sa.smarts.some(
                        (sm) =>
                          matchesSearch(sm.smart.title, q) ||
                          sm.actions.some(
                            (a) =>
                              matchesSearch(a.action.title, q) ||
                              a.subActions.some((s) => matchesSearch(s.subAction.title, q)),
                          ),
                      ),
                  );
                  if (!hasChildMatch && q) return null;
                }
                const axisExpanded = expandedAxes.has(axisNode.axis.id);
                const axisSelected =
                  selectedNode?.type === "axis" && selectedNode.id === axisNode.axis.id;
                return (
                  <div key={axisNode.axis.id}>
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded px-1 py-1 hover:bg-muted/60",
                        axisSelected && "bg-muted",
                      )}
                    >
                      <button
                        type="button"
                        className="shrink-0"
                        onClick={() => toggleAxis(axisNode.axis.id)}
                      >
                        {axisExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left text-sm font-medium whitespace-normal break-words"
                        onClick={() => onSelectNode({ id: axisNode.axis.id, type: "axis" })}
                      >
                        {axisNode.axis.title}
                      </button>
                      <span className="text-xs text-muted-foreground">{axisNode.progress}%</span>
                      {canEdit && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => onAddChild("subAxis", axisNode.axis.id)}
                        >
                          <Plus className="size-3" />
                        </Button>
                      )}
                    </div>
                    {axisExpanded &&
                      axisNode.subAxes.map((subAxisNode) => {
                        const subExpanded = expandedSubAxes.has(subAxisNode.subAxis.id);
                        const subSelected =
                          selectedNode?.type === "subAxis" &&
                          selectedNode.id === subAxisNode.subAxis.id;
                        return (
                          <div key={subAxisNode.subAxis.id} className="ml-4">
                            <div
                              className={cn(
                                "flex items-center gap-1 rounded px-1 py-1 hover:bg-muted/60",
                                subSelected && "bg-muted",
                              )}
                            >
                              <button type="button" onClick={() => toggleSubAxis(subAxisNode.subAxis.id)}>
                                {subExpanded ? (
                                  <ChevronDown className="size-4" />
                                ) : (
                                  <ChevronRight className="size-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                className="min-w-0 flex-1 text-left text-sm whitespace-normal break-words"
                                onClick={() =>
                                  onSelectNode({ id: subAxisNode.subAxis.id, type: "subAxis" })
                                }
                              >
                                {subAxisNode.subAxis.title}
                              </button>
                              {canEdit && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="size-7"
                                  onClick={() => onAddChild("smart", subAxisNode.subAxis.id)}
                                >
                                  <Plus className="size-3" />
                                </Button>
                              )}
                            </div>
                            {subExpanded &&
                              subAxisNode.smarts.map((smartNode) => {
                                const smartExpanded = expandedSmarts.has(smartNode.smart.id);
                                const smartSelected =
                                  selectedNode?.type === "smart" &&
                                  selectedNode.id === smartNode.smart.id;
                                return (
                                  <div key={smartNode.smart.id} className="ml-4">
                                    <div
                                      className={cn(
                                        "flex items-center gap-1 rounded px-1 py-1 hover:bg-muted/60",
                                        smartSelected && "bg-muted",
                                      )}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => toggleSmart(smartNode.smart.id)}
                                      >
                                        {smartExpanded ? (
                                          <ChevronDown className="size-4" />
                                        ) : (
                                          <ChevronRight className="size-4" />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        className="min-w-0 flex-1 text-left text-sm whitespace-normal break-words"
                                        onClick={() =>
                                          onSelectNode({ id: smartNode.smart.id, type: "smart" })
                                        }
                                      >
                                        {smartNode.smart.title}
                                      </button>
                                      {canEdit && (
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          className="size-7"
                                          onClick={() => onAddChild("action", smartNode.smart.id)}
                                        >
                                          <Plus className="size-3" />
                                        </Button>
                                      )}
                                    </div>
                                    {smartExpanded &&
                                      smartNode.actions.map((actionNode) => {
                                        const actionExpanded = expandedActions.has(
                                          actionNode.action.id,
                                        );
                                        const actionSelected =
                                          selectedNode?.type === "action" &&
                                          selectedNode.id === actionNode.action.id;
                                        return (
                                          <div key={actionNode.action.id} className="ml-4">
                                            <div
                                              className={cn(
                                                "flex items-center gap-1 rounded px-1 py-1 hover:bg-muted/60",
                                                actionSelected && "bg-muted",
                                              )}
                                            >
                                              {actionNode.subActions.length > 0 ? (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    toggleAction(actionNode.action.id)
                                                  }
                                                >
                                                  {actionExpanded ? (
                                                    <ChevronDown className="size-4" />
                                                  ) : (
                                                    <ChevronRight className="size-4" />
                                                  )}
                                                </button>
                                              ) : (
                                                <span className="w-4" />
                                              )}
                                              <button
                                                type="button"
                                                className="min-w-0 flex-1 text-left text-sm whitespace-normal break-words"
                                                onClick={() =>
                                                  onSelectNode({
                                                    id: actionNode.action.id,
                                                    type: "action",
                                                  })
                                                }
                                              >
                                                {actionNode.action.title}
                                              </button>
                                              {canEdit && (
                                                <Button
                                                  type="button"
                                                  size="icon"
                                                  variant="ghost"
                                                  className="size-7"
                                                  onClick={() =>
                                                    onAddChild("subAction", actionNode.action.id)
                                                  }
                                                >
                                                  <Plus className="size-3" />
                                                </Button>
                                              )}
                                            </div>
                                            {actionExpanded &&
                                              actionNode.subActions.map((subActionNode) => {
                                                const subActionSelected =
                                                  selectedNode?.type === "subAction" &&
                                                  selectedNode.id === subActionNode.subAction.id;
                                                return (
                                                  <div
                                                    key={subActionNode.subAction.id}
                                                    className={cn(
                                                      "ml-6 rounded px-2 py-1 text-sm hover:bg-muted/60 whitespace-normal break-words",
                                                      subActionSelected && "bg-muted",
                                                    )}
                                                  >
                                                    <button
                                                      type="button"
                                                      className="w-full text-left"
                                                      onClick={() =>
                                                        onSelectNode({
                                                          id: subActionNode.subAction.id,
                                                          type: "subAction",
                                                        })
                                                      }
                                                    >
                                                      {subActionNode.subAction.title}
                                                    </button>
                                                  </div>
                                                );
                                              })}
                                          </div>
                                        );
                                      })}
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
              {plan.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">
                  Aucun axe. {canEdit ? "Ajoutez un axe pour commencer." : ""}
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
  );
}
