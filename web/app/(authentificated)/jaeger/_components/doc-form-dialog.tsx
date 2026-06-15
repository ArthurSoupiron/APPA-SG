"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import {
  createBv,
  createBvPerIntervenant,
  createFa,
  createFs,
  createPvrf,
  createQs,
  createRmi,
  createRmiPerIntervenant,
} from "../_lib/missions-api";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";

export type DocFormType = "fa" | "fs" | "rmi" | "bv" | "pvrf" | "qs";

const DOC_LABELS: Record<DocFormType, string> = {
  fa: "Facture d'acompte (FA)",
  fs: "Facture de solde (FS)",
  rmi: "Récapitulatif de mission (RMI)",
  bv: "Bon de virement (BV)",
  pvrf: "Procès-verbal de réception finale (PVRF)",
  qs: "QS / Procès-verbal réception initiale (PVRI)",
};

const NUMBER_PLACEHOLDERS: Record<DocFormType, string> = {
  fa: "FA-001",
  fs: "FS-001",
  rmi: "RMI-001",
  bv: "BV-001",
  pvrf: "PVRF-001",
  qs: "QS-001",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: DocFormType;
  missionId: string;
  bcId: string;
  isAvenant: boolean;
  onSuccess: () => void;
};

export function DocFormDialog({
  open,
  onOpenChange,
  type,
  missionId,
  bcId,
  isAvenant,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [docNumber, setDocNumber] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (isPending) return;
    setDocNumber("");
    setReason("");
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      setError("Numéro requis.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        switch (type) {
          case "fa":
            await createFa(missionId, bcId, {
              faNumber: docNumber.trim(),
              regle: false,
            });
            break;
          case "fs":
            await createFs(missionId, bcId, {
              fsNumber: docNumber.trim(),
              regle: false,
            });
            break;
          case "rmi":
            if (isAvenant) {
              await createRmi(missionId, bcId, {
                rmiNumber: docNumber.trim(),
                type: "ARMI",
              });
            } else {
              await createRmiPerIntervenant(
                missionId,
                bcId,
                docNumber.trim(),
              );
            }
            break;
          case "bv":
            if (isAvenant) {
              await createBv(missionId, bcId, {
                bvNumber: docNumber.trim(),
                verse: false,
              });
            } else {
              await createBvPerIntervenant(
                missionId,
                bcId,
                docNumber.trim(),
              );
            }
            break;
          case "pvrf":
            await createPvrf(missionId, bcId, {
              pvrfNumber: docNumber.trim(),
              clientValidated: false,
              entrepriseValidated: false,
            });
            break;
          case "qs":
            await createQs(missionId, bcId, {
              qsNumber: docNumber.trim(),
            });
            break;
        }

        toast.success(
          isAvenant
            ? `Avenant ${DOC_LABELS[type]} créé.`
            : `${DOC_LABELS[type]} créé.`,
        );
        setDocNumber("");
        setReason("");
        onSuccess();
      } catch (e) {
        toast.error("Erreur lors de la création.");
        console.error(e);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-none! max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isAvenant ? "Avenant — " : "Nouveau — "}
            {DOC_LABELS[type]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label htmlFor="docNumber" className="text-xs">
              Numéro
            </Label>
            <Input
              id="docNumber"
              className={cn(gm.actionButton, "h-8 text-xs")}
              placeholder={NUMBER_PLACEHOLDERS[type]}
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
            />
            {error && <p className="text-[10px] text-destructive">{error}</p>}
          </div>

          {isAvenant && (
            <div className="space-y-1">
              <Label htmlFor="reason" className="text-xs">
                Motif de l&apos;avenant
              </Label>
              <Input
                id="reason"
                className={cn(gm.actionButton, "h-8 text-xs")}
                placeholder="Ex: modification montant"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={gm.actionButton}
              disabled={isPending}
              onClick={handleClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              className={gm.actionButton}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {isAvenant ? "Créer l'avenant" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
