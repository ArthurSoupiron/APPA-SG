"use client";

import {
  CRM_SECTEUR_SELECT_EMPTY,
  CRM_SECTEURS_OPTIONS,
  isKnownCrmSecteur,
} from "@myster/_lib/crm-secteurs";
import { CRM_PROSPECT_STATUSES, CRM_PROSPECT_STATUT_LABELS } from "@myster/_lib/crm-statuts";
import { PRETEXT, PretextBlock } from "@/components/typography";
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
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import type { FicheFormState, SpRow } from "./crm-sprint-detail-types";

export function CrmSprintDetailFicheSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ficheLoading: boolean;
  canEditFiche: boolean;
  ficheRow: SpRow | null;
  ficheForm: FicheFormState;
  setFicheForm: (f: FicheFormState | ((prev: FicheFormState) => FicheFormState)) => void;
  ficheSaving: boolean;
  onSave: () => void;
}) {
  const {
    open,
    onOpenChange,
    ficheLoading,
    canEditFiche,
    ficheRow,
    ficheForm,
    setFicheForm,
    ficheSaving,
    onSave,
  } = props;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-2xl flex-col gap-0 overflow-y-auto p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <SheetTitle>
            <PretextBlock as="span" metric={PRETEXT.smMedium} text="Fiche prospect" />
          </SheetTitle>
          {ficheRow ? (
            <PretextBlock
              as="p"
              metric={PRETEXT.xs}
              text={`${ficheRow.prenom ? `${ficheRow.prenom} ` : ""}${ficheRow.nom}`}
              className="mt-1 font-normal text-muted-foreground"
            />
          ) : null}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {ficheLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-8" />
            </div>
          ) : (
            <>
              {ficheRow && !canEditFiche ? (
                <div
                  role="paragraph"
                  className="mb-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-muted-foreground text-sm whitespace-normal break-words [overflow-wrap:anywhere]"
                >
                  Lecture seule : seuls le gestionnaire du sprint ou l’utilisateur assigné à ce
                  prospect peuvent modifier la fiche.
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1 sm:col-span-2">
                  <Label htmlFor="sprint-fiche-nom">Nom</Label>
                  <Input
                    id="sprint-fiche-nom"
                    value={ficheForm.nom}
                    onChange={(e) => setFicheForm((f) => ({ ...f, nom: e.target.value }))}
                    disabled={!canEditFiche}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="sprint-fiche-prenom">Prénom</Label>
                  <Input
                    id="sprint-fiche-prenom"
                    value={ficheForm.prenom}
                    onChange={(e) => setFicheForm((f) => ({ ...f, prenom: e.target.value }))}
                    disabled={!canEditFiche}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="sprint-fiche-email">E-mail</Label>
                  <Input
                    id="sprint-fiche-email"
                    type="email"
                    value={ficheForm.email}
                    onChange={(e) => setFicheForm((f) => ({ ...f, email: e.target.value }))}
                    disabled={!canEditFiche}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="sprint-fiche-tel">Téléphone</Label>
                  <Input
                    id="sprint-fiche-tel"
                    value={ficheForm.telephone}
                    onChange={(e) => setFicheForm((f) => ({ ...f, telephone: e.target.value }))}
                    disabled={!canEditFiche}
                  />
                </div>
                <div className="grid gap-1 sm:col-span-2">
                  <Label htmlFor="sprint-fiche-li">LinkedIn</Label>
                  <Input
                    id="sprint-fiche-li"
                    value={ficheForm.linkedin}
                    onChange={(e) => setFicheForm((f) => ({ ...f, linkedin: e.target.value }))}
                    disabled={!canEditFiche}
                  />
                </div>
                <div className="grid gap-1 sm:col-span-2">
                  <Label htmlFor="sprint-fiche-ent">Entreprise</Label>
                  <Input
                    id="sprint-fiche-ent"
                    value={ficheForm.entreprise}
                    onChange={(e) => setFicheForm((f) => ({ ...f, entreprise: e.target.value }))}
                    disabled={!canEditFiche}
                  />
                </div>
                <div className="grid gap-1 sm:col-span-2">
                  <Label htmlFor="sprint-fiche-sec">Secteur (NAF rév. 2)</Label>
                  <Select
                    disabled={!canEditFiche}
                    value={
                      !ficheForm.secteur
                        ? CRM_SECTEUR_SELECT_EMPTY
                        : isKnownCrmSecteur(ficheForm.secteur)
                          ? ficheForm.secteur
                          : "__legacy__"
                    }
                    onValueChange={(v) =>
                      setFicheForm((f) => ({
                        ...f,
                        secteur:
                          v === CRM_SECTEUR_SELECT_EMPTY ? "" : v === "__legacy__" ? f.secteur : v,
                      }))
                    }
                  >
                    <SelectTrigger id="sprint-fiche-sec">
                      <SelectValue placeholder="Choisir…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(70vh,28rem)]">
                      {ficheForm.secteur && !isKnownCrmSecteur(ficheForm.secteur) ? (
                        <SelectItem value="__legacy__">
                          {ficheForm.secteur} (donnée existante)
                        </SelectItem>
                      ) : null}
                      {CRM_SECTEURS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1 sm:col-span-2">
                  <Label htmlFor="sprint-fiche-src">Source</Label>
                  <Input
                    id="sprint-fiche-src"
                    value={ficheForm.source}
                    onChange={(e) => setFicheForm((f) => ({ ...f, source: e.target.value }))}
                    disabled={!canEditFiche}
                  />
                </div>
                <div className="grid gap-1 sm:col-span-2">
                  <Label>Statut</Label>
                  <Select
                    disabled={!canEditFiche}
                    value={ficheForm.statut}
                    onValueChange={(v) => setFicheForm((f) => ({ ...f, statut: v }))}
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
                <div className="grid gap-1 sm:col-span-2">
                  <Label htmlFor="sprint-fiche-notes">Notes</Label>
                  <Textarea
                    id="sprint-fiche-notes"
                    rows={5}
                    value={ficheForm.notes}
                    onChange={(e) => setFicheForm((f) => ({ ...f, notes: e.target.value }))}
                    disabled={!canEditFiche}
                    placeholder="Compte rendu d’appel, prochaine action…"
                    className="whitespace-normal break-words [overflow-wrap:anywhere]"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <SheetFooter className="mt-auto border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {canEditFiche ? (
            <Button
              type="button"
              disabled={ficheSaving || ficheLoading}
              onClick={() => void onSave()}
            >
              {ficheSaving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
