"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  createAction,
  createAxis,
  createSmart,
  createSubAction,
  createSubAxis,
} from "../../_lib/action-plan-api";
import type { TreeNodeType } from "../../_lib/action-plan-types";

type CreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeType: TreeNodeType;
  parentId?: string;
  onCreated: () => Promise<void>;
};

const TITLES: Record<TreeNodeType, string> = {
  axis: "Nouvel axe",
  subAxis: "Nouveau sous-axe",
  smart: "Nouvel objectif SMART",
  action: "Nouvelle action",
  subAction: "Nouvelle sous-action",
};

export function ActionPlanNodeDialog({
  open,
  onOpenChange,
  nodeType,
  parentId,
  onCreated,
}: CreateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      let res: { success: boolean };
      if (nodeType === "axis") {
        res = await createAxis({ title: title.trim(), description });
      } else if (nodeType === "subAxis" && parentId) {
        res = await createSubAxis({ axisId: parentId, title: title.trim(), description });
      } else if (nodeType === "smart" && parentId) {
        res = await createSmart({ subAxisId: parentId, title: title.trim(), description });
      } else if (nodeType === "action" && parentId) {
        res = await createAction({ smartId: parentId, title: title.trim(), description });
      } else if (nodeType === "subAction" && parentId) {
        res = await createSubAction({ actionId: parentId, title: title.trim(), description });
      } else {
        return;
      }
      if (res.success) {
        setTitle("");
        setDescription("");
        onOpenChange(false);
        await onCreated();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{TITLES[nodeType]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-title">Titre</Label>
            <Input
              id="create-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-description">Description</Label>
            <Textarea
              id="create-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={saving || !title.trim()}>
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
