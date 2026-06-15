"use client";

import {
  CRM_SECTEUR_SELECT_EMPTY,
  CRM_SECTEURS_OPTIONS,
  isKnownCrmSecteur,
} from "@myster/_lib/crm-secteurs";
import { CRM_PROSPECT_STATUSES, CRM_PROSPECT_STATUT_LABELS } from "@myster/_lib/crm-statuts";
import { PRETEXT, PretextBlock } from "@/components/typography";
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
import { Textarea } from "@/components/ui/textarea";

import type { Prospect } from "./crm-contacts-types";

export function CrmContactsProspectDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Prospect | null;
  form: Partial<Prospect>;
  setForm: (f: Partial<Prospect> | ((prev: Partial<Prospect>) => Partial<Prospect>)) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const { open, onOpenChange, editing, form, setForm, saving, onSave } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <PretextBlock
              as="span"
              metric={PRETEXT.smMedium}
              text={editing ? "Modifier le prospect" : "Nouveau prospect"}
            />
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
            <Label htmlFor="f-nom">Nom *</Label>
            <Input
              id="f-nom"
              value={form.nom ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="f-prenom">Prénom</Label>
            <Input
              id="f-prenom"
              value={form.prenom ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="f-email">E-mail</Label>
            <Input
              id="f-email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="f-tel">Téléphone</Label>
            <Input
              id="f-tel"
              value={form.telephone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="f-li">LinkedIn</Label>
            <Input
              id="f-li"
              value={form.linkedin ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="f-ent">Entreprise</Label>
            <Input
              id="f-ent"
              value={form.entreprise ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, entreprise: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="f-sec">Secteur (NAF rév. 2)</Label>
            <Select
              value={
                !form.secteur
                  ? CRM_SECTEUR_SELECT_EMPTY
                  : isKnownCrmSecteur(form.secteur)
                    ? form.secteur
                    : "__legacy__"
              }
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  secteur: v === CRM_SECTEUR_SELECT_EMPTY ? "" : v === "__legacy__" ? f.secteur : v,
                }))
              }
            >
              <SelectTrigger id="f-sec" className="w-full">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent className="max-h-[min(70vh,28rem)]">
                {form.secteur && !isKnownCrmSecteur(form.secteur) ? (
                  <SelectItem value="__legacy__">{form.secteur} (donnée existante)</SelectItem>
                ) : null}
                {CRM_SECTEURS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="f-src">Source</Label>
            <Input
              id="f-src"
              value={form.source ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            />
          </div>
          <div className="grid gap-1">
            <Label>Statut</Label>
            <Select
              value={form.statut ?? "a_contacter"}
              onValueChange={(v) => setForm((f) => ({ ...f, statut: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRM_PROSPECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {CRM_PROSPECT_STATUT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="f-notes">Notes</Label>
            <Textarea
              id="f-notes"
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={saving} onClick={() => void onSave()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
