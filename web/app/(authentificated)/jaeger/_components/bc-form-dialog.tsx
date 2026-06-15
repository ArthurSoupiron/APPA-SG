"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
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
  createBc,
  fetchBcEditorData,
  updateBcStructure,
} from "../_lib/missions-api";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";

type DesignationRow = {
  id?: string;
  titre: string;
  description: string;
  nbJeh: string;
  montantJeh: string;
};

type FraisRow = {
  id?: string;
  texte: string;
  montantHt: string;
  tva: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionId: string;
  suggestedNumber: string;
  bcId?: string;
  mode: "create" | "edit";
  onSuccess: () => void;
};

export function BcFormDialog({
  open,
  onOpenChange,
  missionId,
  suggestedNumber,
  bcId,
  mode,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [bcNumber, setBcNumber] = useState(suggestedNumber);
  const [designations, setDesignations] = useState<DesignationRow[]>([
    { titre: "", description: "", nbJeh: "", montantJeh: "" },
  ]);
  const [frais, setFrais] = useState<FraisRow[]>([
    { texte: "", montantHt: "", tva: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const reset = useCallback(() => {
    setBcNumber(suggestedNumber);
    setDesignations([
      { titre: "", description: "", nbJeh: "", montantJeh: "" },
    ]);
    setFrais([{ texte: "", montantHt: "", tva: "" }]);
  }, [suggestedNumber]);

  useEffect(() => {
    if (!open) return;
    if (mode === "create") {
      reset();
      return;
    }
    if (!bcId) return;
    setIsLoading(true);
    fetchBcEditorData(missionId, bcId)
      .then((data) => {
        if (!data) return;
        setBcNumber(data.bcNumber);
        setDesignations(
          data.designations.length > 0
            ? data.designations.map((d) => ({
                id: d.id,
                titre: d.titre,
                description: d.description ?? "",
                nbJeh: d.nbJeh?.toString() ?? "",
                montantJeh: d.montantJeh ?? "",
              }))
            : [{ titre: "", description: "", nbJeh: "", montantJeh: "" }],
        );
        setFrais(
          data.frais.length > 0
            ? data.frais.map((f) => ({
                id: f.id,
                texte: f.texte,
                montantHt: f.montantHt ?? "",
                tva: f.tva ?? "",
              }))
            : [{ texte: "", montantHt: "", tva: "" }],
        );
      })
      .catch((e) => {
        console.error(e);
        toast.error("Impossible de charger le BC.");
      })
      .finally(() => setIsLoading(false));
  }, [open, mode, bcId, reset, missionId]);

  const close = () => {
    if (isPending) return;
    reset();
    onOpenChange(false);
  };

  const submit = () => {
    if (!bcNumber.trim()) {
      toast.error("Le numéro de BC est requis.");
      return;
    }
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createBc(missionId, {
            bcNumber: bcNumber.trim(),
            designations: designations.map((d) => ({
              titre: d.titre,
              description: d.description || null,
              nbJeh: d.nbJeh ? Number(d.nbJeh) : null,
              montantJeh: d.montantJeh || null,
            })),
            frais: frais.map((f) => ({
              texte: f.texte,
              montantHt: f.montantHt || null,
              tva: f.tva || null,
            })),
          });
        } else {
          if (!bcId) throw new Error("BC introuvable.");
          await updateBcStructure(missionId, bcId, {
            bcNumber: bcNumber.trim(),
            designations: designations.map((d) => ({
              id: d.id,
              titre: d.titre,
              description: d.description || null,
              nbJeh: d.nbJeh ? Number(d.nbJeh) : null,
              montantJeh: d.montantJeh || null,
            })),
            frais: frais.map((f) => ({
              id: f.id,
              texte: f.texte,
              montantHt: f.montantHt || null,
              tva: f.tva || null,
            })),
          });
        }
        toast.success(
          mode === "create"
            ? "BC créé avec désignations et frais."
            : "BC modifié avec succès.",
        );
        onSuccess();
        close();
      } catch (e) {
        console.error(e);
        toast.error("Création du BC impossible.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="rounded-none! w-fit max-w-[96vw] min-w-[1120px]">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "create" ? "Nouveau BC" : "Modifier BC"}
          </DialogTitle>
        </DialogHeader>

        <div className="w-full min-w-[1080px] space-y-3 max-h-[78vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <Label className="text-xs">Numéro BC</Label>
            <Input
              value={bcNumber}
              onChange={(e) => setBcNumber(e.target.value)}
              className={cn(gm.actionButton, "h-8 text-xs")}
              placeholder="BC-001"
            />
          </div>

          <div className={cn(gm.sectionContainer)}>
            <div className={cn(gm.sectionHeader, "py-2")}>
              <p className="text-xs font-semibold">Désignations</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(gm.actionButton, "h-6 text-[10px]")}
                onClick={() =>
                  setDesignations((prev) => [
                    ...prev,
                    { titre: "", description: "", nbJeh: "", montantJeh: "" },
                  ])
                }
              >
                <Plus className="mr-1 h-3 w-3" />
                Ajouter
              </Button>
            </div>
            <div className="space-y-2 overflow-x-auto p-2">
              {designations.map((d, idx) => (
                <div
                  key={d.id ?? idx}
                  className="grid min-w-[1040px] grid-cols-12 gap-2"
                >
                  <Input
                    className={cn(gm.actionButton, "col-span-3 h-8 text-xs")}
                    placeholder="Titre"
                    value={d.titre}
                    onChange={(e) =>
                      setDesignations((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, titre: e.target.value } : row,
                        ),
                      )
                    }
                  />
                  <Input
                    className={cn(gm.actionButton, "col-span-7 h-8 text-xs")}
                    placeholder="Description"
                    value={d.description}
                    onChange={(e) =>
                      setDesignations((prev) =>
                        prev.map((row, i) =>
                          i === idx
                            ? { ...row, description: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                  <Input
                    className={cn(gm.actionButton, "col-span-1 h-8 text-xs")}
                    placeholder="JEH"
                    value={d.nbJeh}
                    onChange={(e) =>
                      setDesignations((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, nbJeh: e.target.value } : row,
                        ),
                      )
                    }
                  />
                  <Input
                    className={cn(gm.actionButton, "col-span-1 h-8 text-xs")}
                    placeholder="€"
                    value={d.montantJeh}
                    onChange={(e) =>
                      setDesignations((prev) =>
                        prev.map((row, i) =>
                          i === idx
                            ? { ...row, montantJeh: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-1 h-8 w-8 rounded-none"
                    onClick={() =>
                      setDesignations((prev) =>
                        prev.filter((_, i) => i !== idx),
                      )
                    }
                    disabled={designations.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(gm.sectionContainer)}>
            <div className={cn(gm.sectionHeader, "py-2")}>
              <div>
                <p className="text-xs font-semibold">Frais</p>
                <p className="text-[10px] text-muted-foreground">
                  TVA attendue en pourcentage (ex: 20 pour 20%)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(gm.actionButton, "h-6 text-[10px]")}
                onClick={() =>
                  setFrais((prev) => [
                    ...prev,
                    { texte: "", montantHt: "", tva: "" },
                  ])
                }
              >
                <Plus className="mr-1 h-3 w-3" />
                Ajouter
              </Button>
            </div>
            <div className="space-y-2 overflow-x-auto p-2">
              {frais.map((f, idx) => (
                <div
                  key={f.id ?? idx}
                  className="grid min-w-[1040px] grid-cols-12 gap-2"
                >
                  <Input
                    className={cn(gm.actionButton, "col-span-8 h-8 text-xs")}
                    placeholder="Texte du frais"
                    value={f.texte}
                    onChange={(e) =>
                      setFrais((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, texte: e.target.value } : row,
                        ),
                      )
                    }
                  />
                  <Input
                    className={cn(gm.actionButton, "col-span-2 h-8 text-xs")}
                    placeholder="Montant HT"
                    value={f.montantHt}
                    onChange={(e) =>
                      setFrais((prev) =>
                        prev.map((row, i) =>
                          i === idx
                            ? { ...row, montantHt: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                  <Input
                    className={cn(gm.actionButton, "col-span-1 h-8 text-xs")}
                    placeholder="TVA %"
                    value={f.tva}
                    onChange={(e) =>
                      setFrais((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, tva: e.target.value } : row,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-1 h-8 w-8 rounded-none"
                    onClick={() =>
                      setFrais((prev) => prev.filter((_, i) => i !== idx))
                    }
                    disabled={frais.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className={gm.actionButton}
            onClick={close}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className={gm.actionButton}
            disabled={isPending || isLoading}
            onClick={submit}
          >
            {(isPending || isLoading) && (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            )}
            {mode === "create" ? "Créer BC" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
