"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

import type { ActionPlanTree } from "../../_lib/action-plan-types";
import { getStatusColor, getStatusLabel } from "../action-plan-view-shared";

type GanttRow = {
  id: string;
  kind: "action" | "subAction";
  title: string;
  status: string;
  startDate: Date | null;
  dueDate: Date | null;
  level: number;
};

type GanttViewProps = {
  plan: ActionPlanTree;
  onSelect?: (id: string, kind: "action" | "subAction") => void;
};

function parseDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function ActionPlanGanttView({ plan, onSelect }: GanttViewProps) {
  const rows = useMemo(() => {
    const out: GanttRow[] = [];
    for (const axis of plan) {
      for (const subAxis of axis.subAxes) {
        for (const smart of subAxis.smarts) {
          for (const action of smart.actions) {
            const aStart = parseDate(action.action.startDate);
            const aDue = parseDate(action.action.dueDate);
            if (aStart || aDue) {
              out.push({
                id: action.action.id,
                kind: "action",
                title: action.action.title,
                status: action.action.status,
                startDate: aStart,
                dueDate: aDue,
                level: 0,
              });
            }
            for (const subAction of action.subActions) {
              const sStart = parseDate(subAction.subAction.startDate);
              const sDue = parseDate(subAction.subAction.dueDate);
              if (sStart || sDue) {
                out.push({
                  id: subAction.subAction.id,
                  kind: "subAction",
                  title: subAction.subAction.title,
                  status: subAction.subAction.status,
                  startDate: sStart,
                  dueDate: sDue,
                  level: 1,
                });
              }
            }
          }
        }
      }
    }
    return out;
  }, [plan]);

  const dateRange = useMemo(() => {
    const dates: Date[] = [];
    for (const row of rows) {
      if (row.startDate) dates.push(row.startDate);
      if (row.dueDate) dates.push(row.dueDate);
    }
    if (dates.length === 0) {
      const now = new Date();
      return { min: now, max: new Date(now.getTime() + 30 * 86400000) };
    }
    return {
      min: new Date(Math.min(...dates.map((d) => d.getTime()))),
      max: new Date(Math.max(...dates.map((d) => d.getTime()))),
    };
  }, [rows]);

  const minMs = dateRange.min.getTime();
  const maxMs = dateRange.max.getTime();
  const rangeMs = maxMs - minMs || 1;
  const today = new Date();
  const todayPercent = ((today.getTime() - minMs) / rangeMs) * 100;

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune action avec dates de début ou d&apos;échéance.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="relative min-w-[640px]">
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-destructive/70"
          style={{ left: `${Math.min(100, Math.max(0, todayPercent))}%` }}
          title="Aujourd'hui"
        />
        {rows.map((row) => {
          const startMs = row.startDate?.getTime() ?? row.dueDate!.getTime();
          const endMs = row.dueDate?.getTime() ?? row.startDate!.getTime();
          const leftPercent = ((startMs - minMs) / rangeMs) * 100;
          const widthPercent = ((endMs - startMs) / rangeMs) * 100 || 2;
          return (
            <div
              key={`${row.kind}-${row.id}`}
              className="flex items-center gap-2 border-b px-2 py-2 last:border-b-0"
            >
              <div
                className="w-48 shrink-0 text-sm whitespace-normal break-words"
                style={{ paddingLeft: row.level * 12 }}
              >
                <button
                  type="button"
                  className="text-left hover:underline"
                  onClick={() => onSelect?.(row.id, row.kind)}
                >
                  {row.title}
                </button>
              </div>
              <div className="relative h-6 min-w-0 flex-1 rounded bg-muted/40">
                <button
                  type="button"
                  className={cn(
                    "absolute top-0.5 h-5 min-w-[2%] rounded px-1 text-[10px] text-white whitespace-normal",
                    getStatusColor(row.status as "not_started"),
                  )}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.max(2, widthPercent)}%`,
                  }}
                  onClick={() => onSelect?.(row.id, row.kind)}
                  title={getStatusLabel(row.status as "not_started")}
                >
                  <span className="sr-only">{row.title}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between border-t px-2 py-1 text-xs text-muted-foreground">
        <span>{dateRange.min.toLocaleDateString("fr-FR")}</span>
        <span>{dateRange.max.toLocaleDateString("fr-FR")}</span>
      </div>
    </div>
  );
}
