"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

import { STATUS_OPTIONS } from "../../_lib/action-plan-constants";
import type { ActionPlanStatus, KanbanCard } from "../../_lib/action-plan-types";
import {
  CampusBadge,
  PolesBadges,
  ProgressBar,
  getStatusColor,
  getStatusLabel,
} from "../action-plan-view-shared";

type KanbanViewProps = {
  columns: Record<ActionPlanStatus, KanbanCard[]>;
  canEdit: boolean;
  kanbanUpdatingId: string | null;
  onStatusDrop: (
    payload: { kind: KanbanCard["kind"]; id: string },
    newStatus: ActionPlanStatus,
  ) => void;
  onCardClick?: (card: KanbanCard) => void;
};

type KanbanCardItemProps = {
  card: KanbanCard;
  canEdit: boolean;
  isUpdating: boolean;
  onCardClick?: (card: KanbanCard) => void;
};

function KanbanCardItem({ card, canEdit, isUpdating, onCardClick }: KanbanCardItemProps) {
  const draggedRef = useRef(false);

  return (
    <div
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      draggable={canEdit}
      onDragStart={(e) => {
        if (!canEdit) return;
        draggedRef.current = true;
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({
            kind: card.kind,
            id: card.id,
            currentStatus: card.status,
          }),
        );
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          draggedRef.current = false;
        }, 0);
      }}
      onClick={() => {
        if (draggedRef.current || !onCardClick) return;
        onCardClick(card);
      }}
      onKeyDown={(e) => {
        if (!onCardClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCardClick(card);
        }
      }}
      className={cn(
        "rounded-md border bg-card p-3 shadow-sm text-left",
        isUpdating && "opacity-50",
        canEdit && "cursor-grab active:cursor-grabbing",
        onCardClick && "cursor-pointer hover:border-primary/40 hover:bg-accent/30",
      )}
    >
      <p className="text-sm font-medium whitespace-normal break-words">{card.title}</p>
      <p className="mt-1 text-xs text-muted-foreground whitespace-normal break-words">
        {card.axisTitle} → {card.subAxisTitle} → {card.smartTitle}
      </p>
      {card.owner && (
        <p className="mt-1 text-xs whitespace-normal break-words">{card.owner}</p>
      )}
      <div className="mt-2">
        <ProgressBar value={card.progress} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <CampusBadge campus={card.campus} />
        <PolesBadges poles={card.poles} />
      </div>
      <span
        className={cn(
          "mt-2 inline-block rounded px-1.5 py-0.5 text-xs",
          getStatusColor(card.status),
        )}
      >
        {getStatusLabel(card.status)}
      </span>
    </div>
  );
}

export function ActionPlanKanbanView({
  columns,
  canEdit,
  kanbanUpdatingId,
  onStatusDrop,
  onCardClick,
}: KanbanViewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STATUS_OPTIONS.map((col) => (
        <div
          key={col.value}
          className="flex min-h-[320px] flex-col rounded-lg border bg-muted/20"
          onDragOver={(e) => {
            if (canEdit) e.preventDefault();
          }}
          onDrop={(e) => {
            if (!canEdit) return;
            e.preventDefault();
            try {
              const payload = JSON.parse(
                e.dataTransfer.getData("application/json"),
              ) as { kind: KanbanCard["kind"]; id: string; currentStatus: ActionPlanStatus };
              if (payload.currentStatus !== col.value) {
                onStatusDrop({ kind: payload.kind, id: payload.id }, col.value);
              }
            } catch {
              /* ignore */
            }
          }}
        >
          <div
            className={cn(
              "border-b px-3 py-2 text-sm font-medium",
              getStatusColor(col.value),
            )}
          >
            {col.label} ({columns[col.value].length})
          </div>
          <div className="flex flex-1 flex-col gap-2 p-2">
            {columns[col.value].map((card) => (
              <KanbanCardItem
                key={`${card.kind}-${card.id}`}
                card={card}
                canEdit={canEdit}
                isUpdating={kanbanUpdatingId === card.id}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
