"use client";

import { useEffect, useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RegistreDto, RegistreType, TraitementDataDto } from "../../_lib/si-registres-types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: RegistreType;
  editing: RegistreDto | null;
  traitements: TraitementDataDto[];
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
};

export function RegistreFormDialog({
  open,
  onOpenChange,
  type,
  editing,
  traitements,
  onSubmit,
}: Props) {
  const [anneeCivile, setAnneeCivile] = useState(String(new Date().getFullYear()));
  const [nom, setNom] = useState("");
  const [dateFacturation, setDateFacturation] = useState("");
  const [utilisationCommerciale, setUtilisationCommerciale] = useState("false");
  const [licenceCommercialeUrl, setLicenceCommercialeUrl] = useState("");
  const [traitementDataId, setTraitementDataId] = useState<string>("");
  const [sheetExcelUrl, setSheetExcelUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setAnneeCivile(String(editing.anneeCivile));
      setNom(editing.nom);
      if (editing.type === "licences") {
        setDateFacturation(editing.dateFacturation?.slice(0, 10) ?? "");
        setUtilisationCommerciale(editing.utilisationCommerciale ? "true" : "false");
        setLicenceCommercialeUrl(editing.licenceCommercialeUrl ?? "");
      }
      if (editing.type === "bdd") {
        setTraitementDataId(editing.traitementDataId ?? "");
        setSheetExcelUrl(editing.sheetExcelUrl ?? "");
      }
    } else {
      setAnneeCivile(String(new Date().getFullYear()));
      setNom("");
      setDateFacturation("");
      setUtilisationCommerciale("false");
      setLicenceCommercialeUrl("");
      setTraitementDataId("");
      setSheetExcelUrl("");
    }
  }, [open, editing]);

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {
      anneeCivile: Number(anneeCivile),
      nom: nom.trim(),
    };
    if (type === "licences") {
      payload.dateFacturation = dateFacturation || null;
      payload.utilisationCommerciale = utilisationCommerciale === "true";
      payload.licenceCommercialeUrl = licenceCommercialeUrl.trim() || null;
    }
    if (type === "bdd") {
      payload.traitementDataId = traitementDataId || null;
      payload.sheetExcelUrl = sheetExcelUrl.trim() || null;
    }
    await onSubmit(payload);
    setSaving(false);
    onOpenChange(false);
  };

  const title =
    type === "rgpd" ? "Registre RGPD" : type === "licences" ? "Registre licences" : "Registre BDD";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Modifier — ${title}` : `Nouveau — ${title}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="annee">Année civile</Label>
            <Input id="annee" type="number" value={anneeCivile} onChange={(e) => setAnneeCivile(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          {type === "licences" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dateFacturation">Date de facturation</Label>
                <Input
                  id="dateFacturation"
                  type="date"
                  value={dateFacturation}
                  onChange={(e) => setDateFacturation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Utilisation commerciale</Label>
                <Select value={utilisationCommerciale} onValueChange={setUtilisationCommerciale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Non</SelectItem>
                    <SelectItem value="true">Oui</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenceUrl">URL licence commerciale</Label>
                <Input
                  id="licenceUrl"
                  value={licenceCommercialeUrl}
                  onChange={(e) => setLicenceCommercialeUrl(e.target.value)}
                />
              </div>
            </>
          )}
          {type === "bdd" && (
            <>
              <div className="space-y-2">
                <Label>Traitement de données lié</Label>
                <Select value={traitementDataId || "__none"} onValueChange={(v) => setTraitementDataId(v === "__none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Aucun</SelectItem>
                    {traitements.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.reference} — {t.nomTraitement}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheetUrl">URL Google Sheet</Label>
                <Input id="sheetUrl" value={sheetExcelUrl} onChange={(e) => setSheetExcelUrl(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={saving || !nom.trim()} onClick={() => void handleSave()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
