"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { listPendingTemplateDocx, validateTemplateDocx } from "../_lib/missions-api";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";
import type { TemplateDocType } from "../_lib/missions-types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionId: string;
  bcId?: string | null;
  documentType: TemplateDocType;
  canValidate: boolean;
  onSuccess: () => void;
};

export function TemplateValidationDialog({
  open,
  onOpenChange,
  missionId,
  bcId,
  documentType,
  canValidate,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [pendingDocx, setPendingDocx] = useState<
    Array<{ id: string; name: string; webViewLink: string }>
  >([]);
  const title = useMemo(() => `Validation PDF ${documentType}`, [documentType]);

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const pending = await listPendingTemplateDocx({
        missionId,
        bcId: bcId ?? null,
        documentType,
      });
      setPendingDocx(pending);
    });
  }, [open, missionId, bcId, documentType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none! w-fit max-w-[96vw] min-w-[760px]">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {isPending ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement des fichiers DOCX en attente…
            </div>
          ) : pendingDocx.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun DOCX en attente.</p>
          ) : (
            pendingDocx.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-2 border border-slate-300/85 px-2 py-1 text-[11px] dark:border-white/8"
              >
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 underline underline-offset-2 whitespace-normal wrap-anywhere"
                >
                  {file.name}
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={cn(gm.actionButton, "h-7 shrink-0 px-2 text-[10px]")}
                  disabled={isPending || !canValidate}
                  onClick={() =>
                    startTransition(async () => {
                      await validateTemplateDocx({
                        missionId,
                        bcId: bcId ?? null,
                        documentType,
                        docxFileId: file.id,
                      });
                      const pending = await listPendingTemplateDocx({
                        missionId,
                        bcId: bcId ?? null,
                        documentType,
                      });
                      setPendingDocx(pending);
                      onSuccess();
                    })
                  }
                >
                  Valider (PDF)
                </Button>
              </div>
            ))
          )}
          {!canValidate ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-300">
              Vous n&apos;avez pas la permission de valider (convertir DOCX → PDF sur Drive).
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
