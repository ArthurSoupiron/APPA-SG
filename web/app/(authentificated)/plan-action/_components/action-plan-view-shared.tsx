"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { CAMPUS_OPTIONS, POLE_LABELS, STATUS_OPTIONS } from "../_lib/action-plan-constants";
import type { ActionPlanCampus, ActionPlanStatus } from "../_lib/action-plan-types";

export type KanbanStatus = ActionPlanStatus;

export function getStatusLabel(status: ActionPlanStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

export function getStatusColor(status: ActionPlanStatus): string {
  switch (status) {
    case "not_started":
      return "bg-muted text-muted-foreground";
    case "in_progress":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
    case "done":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "blocked":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  }
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function PolesBadges({ poles }: { poles: string[] }) {
  if (poles.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {poles.map((pole) => (
        <Badge key={pole} variant="secondary" className="whitespace-normal break-words">
          {POLE_LABELS[pole as keyof typeof POLE_LABELS] ?? pole}
        </Badge>
      ))}
    </div>
  );
}

export function CampusBadge({ campus }: { campus: ActionPlanCampus | null }) {
  if (!campus) return null;
  const label = CAMPUS_OPTIONS.find((c) => c.value === campus)?.label ?? campus;
  return (
    <Badge variant="outline" className="whitespace-normal">
      {label}
    </Badge>
  );
}
