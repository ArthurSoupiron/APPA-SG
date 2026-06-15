"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  depositTraitementTemplate,
  uploadTraitementPdf,
} from "../../_lib/si-registres-api";
import type { TraitementDataDto } from "../../_lib/si-registres-types";
import { RegistreExternalLink } from "./registres-display-helpers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  traitement: TraitementDataDto | null;
  templateUrl: string;
  onUpdated: (traitement: TraitementDataDto) => void;
};

export function TraitementFicheDialog({
  open,
  onOpenChange,
  traitement,
  templateUrl,
  onUpdated,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [depositing, setDepositing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDepositTemplate = async () => {
    if (!traitement) return;
    setDepositing(true);
    const result = await depositTraitementTemplate(traitement.id);
    setDepositing(false);
    if (result?.traitement) onUpdated(result.traitement);
  };

  const handleUploadPdf = async (file: File) => {
    if (!traitement) return;
    setUploading(true);
    const updated = await uploadTraitementPdf(traitement.id, file);
    setUploading(false);
    if (updated) onUpdated(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Fiche & modèle — {traitement?.nomTraitement}</DialogTitle>
          <DialogDescription className="whitespace-normal break-words">
            Déposez le modèle KiwiX ou importez la fiche PDF complétée dans le dossier Drive du
            traitement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-sm font-medium">Modèle KiwiX</p>
            <p className="text-sm text-muted-foreground whitespace-normal break-words">
              Document de référence pour la fiche de traitement de données.
            </p>
            <RegistreExternalLink url={templateUrl} label="Ouvrir le modèle KiwiX" />
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={depositing || !traitement?.driveFolderUrl}
              onClick={() => void handleDepositTemplate()}
            >
              {depositing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Dépôt en cours…
                </>
              ) : (
                "Déposer le modèle dans le dossier Drive"
              )}
            </Button>
            {!traitement?.driveFolderUrl && (
              <p className="text-xs text-muted-foreground whitespace-normal break-words">
                Aucun dossier Drive lié à ce traitement.
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-sm font-medium">Fiche PDF complétée</p>
            <p className="text-sm text-muted-foreground whitespace-normal break-words">
              Si le dépôt automatique du modèle échoue, téléchargez le fichier depuis KiwiX puis
              importez-le ici.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUploadPdf(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading || !traitement?.driveFolderUrl}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Import en cours…
                </>
              ) : (
                <>
                  <FileUp className="mr-2 size-4" />
                  Importer une fiche PDF
                </>
              )}
            </Button>
            {traitement?.fichePdfUrl && (
              <p className="text-sm">
                Fiche actuelle :{" "}
                <RegistreExternalLink url={traitement.fichePdfUrl} label="Voir la fiche PDF" />
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
