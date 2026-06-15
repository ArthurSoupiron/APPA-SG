"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  deleteAction,
  deleteAxis,
  deleteSmart,
  deleteSubAction,
  deleteSubAxis,
  updateAction,
  updateAxis,
  updateSmart,
  updateSubAxis,
  updateSubAction,
} from "../../_lib/action-plan-api";
import {
  ACTION_PLAN_POLES,
  CAMPUS_OPTIONS,
  POLE_LABELS,
  STATUS_OPTIONS,
} from "../../_lib/action-plan-constants";
import type {
  ActionPlanAction,
  ActionPlanAxis,
  ActionPlanPole,
  ActionPlanSmart,
  ActionPlanSubAction,
  ActionPlanSubAxis,
  TreeNodeType,
} from "../../_lib/action-plan-types";
import { CampusBadge, PolesBadges, ProgressBar, getStatusColor, getStatusLabel } from "../action-plan-view-shared";
import { ActionPlanDayPickerField } from "../action-plan-day-picker-field";

type DetailEditorProps = {
  nodeType: TreeNodeType;
  axis?: ActionPlanAxis;
  subAxis?: ActionPlanSubAxis;
  smart?: ActionPlanSmart;
  action?: ActionPlanAction;
  subAction?: ActionPlanSubAction;
  canEdit: boolean;
  canDelete: boolean;
  onUpdated: () => Promise<void>;
  onDeleted: () => Promise<void>;
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function ActionPlanDetailEditor({
  nodeType,
  axis,
  subAxis,
  smart,
  action,
  subAction,
  canEdit,
  canDelete,
  onUpdated,
  onDeleted,
}: DetailEditorProps) {
  const entity =
    nodeType === "axis"
      ? axis
      : nodeType === "subAxis"
        ? subAxis
        : nodeType === "smart"
          ? smart
          : nodeType === "action"
            ? action
            : subAction;

  const [title, setTitle] = useState(entity?.title ?? "");
  const [description, setDescription] = useState(entity?.description ?? "");
  const [owner, setOwner] = useState(
    action?.owner ?? subAction?.owner ?? "",
  );
  const [status, setStatus] = useState(action?.status ?? subAction?.status ?? "not_started");
  const [progress, setProgress] = useState(action?.progress ?? subAction?.progress ?? 0);
  const [priority, setPriority] = useState(
    String(action?.priority ?? subAction?.priority ?? ""),
  );
  const [campus, setCampus] = useState(action?.campus ?? subAction?.campus ?? "");
  const [startDate, setStartDate] = useState(
    toDateInput(action?.startDate ?? subAction?.startDate ?? null),
  );
  const [dueDate, setDueDate] = useState(
    toDateInput(action?.dueDate ?? subAction?.dueDate ?? null),
  );
  const [poles, setPoles] = useState<string[]>(action?.poles ?? subAction?.poles ?? []);
  const [saving, setSaving] = useState(false);

  if (!entity) {
    return (
      <p className="text-sm text-muted-foreground">
        Sélectionnez un élément dans l&apos;arbre pour afficher le détail.
      </p>
    );
  }

  const togglePole = (pole: ActionPlanPole) => {
    setPoles((prev) =>
      prev.includes(pole) ? prev.filter((p) => p !== pole) : [...prev, pole],
    );
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      let res: { success: boolean };
      if (nodeType === "axis" && axis) {
        res = await updateAxis(axis.id, { title, description });
      } else if (nodeType === "subAxis" && subAxis) {
        res = await updateSubAxis(subAxis.id, { title, description });
      } else if (nodeType === "smart" && smart) {
        res = await updateSmart(smart.id, { title, description });
      } else if (nodeType === "action" && action) {
        res = await updateAction(action.id, {
          title,
          description,
          owner: owner || undefined,
          status,
          progress,
          priority: priority ? Number(priority) : undefined,
          campus: campus ? (campus as ActionPlanAction["campus"]) : null,
          startDate: startDate ? new Date(startDate).toISOString() : null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          poles: poles as ActionPlanPole[],
        });
      } else if (nodeType === "subAction" && subAction) {
        res = await updateSubAction(subAction.id, {
          title,
          description,
          owner: owner || undefined,
          status,
          progress,
          priority: priority ? Number(priority) : undefined,
          campus: campus ? (campus as ActionPlanSubAction["campus"]) : null,
          startDate: startDate ? new Date(startDate).toISOString() : null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          poles: poles as ActionPlanPole[],
        });
      } else {
        return;
      }
      if (res.success) {
        toast.success("Enregistré.");
        await onUpdated();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setSaving(true);
    try {
      let res: { success: boolean };
      if (nodeType === "axis" && axis) res = await deleteAxis(axis.id);
      else if (nodeType === "subAxis" && subAxis) res = await deleteSubAxis(subAxis.id);
      else if (nodeType === "smart" && smart) res = await deleteSmart(smart.id);
      else if (nodeType === "action" && action) res = await deleteAction(action.id);
      else if (nodeType === "subAction" && subAction) res = await deleteSubAction(subAction.id);
      else return;
      if (res.success) {
        toast.success("Supprimé.");
        await onDeleted();
      }
    } finally {
      setSaving(false);
    }
  };

  const isTask = nodeType === "action" || nodeType === "subAction";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="detail-title">Titre</Label>
        <Input
          id="detail-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="detail-description">Description</Label>
        <Textarea
          id="detail-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!canEdit}
          rows={4}
          className="whitespace-normal break-words"
        />
      </div>

      {isTask && (
        <>
          <div className="space-y-2">
            <Label htmlFor="detail-owner">Responsable</Label>
            <Input
              id="detail-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className={`inline-block rounded px-2 py-0.5 text-xs ${getStatusColor(status)}`}>
                {getStatusLabel(status)}
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail-progress">Progression (%)</Label>
              <Input
                id="detail-progress"
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                disabled={!canEdit}
              />
              <ProgressBar value={progress} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ActionPlanDayPickerField
              id="detail-start"
              label="Début"
              value={startDate}
              onChange={setStartDate}
              disabled={!canEdit}
              placeholder="Aucune date de début"
            />
            <ActionPlanDayPickerField
              id="detail-due"
              label="Échéance"
              value={dueDate}
              onChange={setDueDate}
              disabled={!canEdit}
              placeholder="Aucune échéance"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Campus</Label>
              <Select
                value={campus || "__none__"}
                onValueChange={(v) => setCampus(v === "__none__" ? "" : v)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucun</SelectItem>
                  {CAMPUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CampusBadge campus={campus ? (campus as ActionPlanAction["campus"]) : null} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail-priority">Priorité</Label>
              <Input
                id="detail-priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Pôles</Label>
            <div className="flex flex-wrap gap-2">
              {ACTION_PLAN_POLES.map((pole) => (
                <Button
                  key={pole}
                  type="button"
                  size="sm"
                  variant={poles.includes(pole) ? "default" : "outline"}
                  disabled={!canEdit}
                  onClick={() => togglePole(pole)}
                >
                  {POLE_LABELS[pole]}
                </Button>
              ))}
            </div>
            <PolesBadges poles={poles} />
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Button onClick={handleSave} disabled={saving}>
            Enregistrer
          </Button>
        )}
        {canDelete && (
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
