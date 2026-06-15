"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type {
  ActionPlanAction,
  ActionPlanSubAction,
  TreeNodeType,
} from "../_lib/action-plan-types";
import { ActionPlanDetailEditor } from "./detail-editor/action-plan-detail-editor";

type ActionPlanDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeType: TreeNodeType;
  action?: ActionPlanAction;
  subAction?: ActionPlanSubAction;
  canEdit: boolean;
  canDelete: boolean;
  onUpdated: () => Promise<void>;
  onDeleted: () => Promise<void>;
};

export function ActionPlanDetailSheet({
  open,
  onOpenChange,
  nodeType,
  action,
  subAction,
  canEdit,
  canDelete,
  onUpdated,
  onDeleted,
}: ActionPlanDetailSheetProps) {
  const title =
    nodeType === "subAction"
      ? subAction?.title
      : nodeType === "action"
        ? action?.title
        : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="wide" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title ? `Modifier — ${title}` : "Modifier"}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          <ActionPlanDetailEditor
            key={`${nodeType}-${action?.id ?? subAction?.id ?? "none"}`}
            nodeType={nodeType}
            action={action}
            subAction={subAction}
            canEdit={canEdit}
            canDelete={canDelete}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
