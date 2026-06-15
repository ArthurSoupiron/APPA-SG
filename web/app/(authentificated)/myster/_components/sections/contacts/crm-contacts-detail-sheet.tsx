"use client";

import {
  CRM_CONTACT_EVENT_KIND_LABELS,
  CRM_CONTACT_EVENT_KINDS,
  type CrmContactEventKind,
} from "@myster/_lib/crm-contact-event-kinds";
import {
  CRM_PROSPECT_STATUT_LABELS,
  CRM_STATUT_BADGE_CLASS,
  type CrmProspectStatut,
} from "@myster/_lib/crm-statuts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { formatTimelineAt, type Prospect, type ProspectTimelineEntry } from "./crm-contacts-types";
import { CrmContactsApolloFields } from "./crm-contacts-apollo-fields";

export function CrmContactsDetailSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetLoading: boolean;
  sheetProspect: Prospect | null;
  sheetTimeline: ProspectTimelineEntry[];
  hasPermission: (p: string) => boolean;
  quickNote: string;
  setQuickNote: (v: string) => void;
  quickNoteBusy: boolean;
  onSubmitQuickNote: () => void;
  quickEventKind: CrmContactEventKind;
  setQuickEventKind: (v: CrmContactEventKind) => void;
  quickEventBusy: boolean;
  onSubmitQuickContactEvent: () => void;
  onEditInForm: () => void;
}) {
  const {
    open,
    onOpenChange,
    sheetLoading,
    sheetProspect,
    sheetTimeline,
    hasPermission,
    quickNote,
    setQuickNote,
    quickNoteBusy,
    onSubmitQuickNote,
    quickEventKind,
    setQuickEventKind,
    quickEventBusy,
    onSubmitQuickContactEvent,
    onEditInForm,
  } = props;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {sheetProspect
              ? `${sheetProspect.prenom ? `${sheetProspect.prenom} ` : ""}${sheetProspect.nom}`
              : "Prospect"}
          </SheetTitle>
          <SheetDescription className="whitespace-normal break-words">
            Journal et détail — ouvrez le formulaire pour modifier tous les champs.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-6 pb-6">
          {sheetLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="size-8" />
            </div>
          ) : sheetProspect ? (
            <>
              <div className="space-y-2 border-b border-border pb-3 text-sm">
                <div role="paragraph" className="whitespace-normal break-words">
                  <span className="text-muted-foreground">E-mail : </span>
                  {sheetProspect.email ?? "—"}
                </div>
                <div role="paragraph" className="whitespace-normal break-words">
                  <span className="text-muted-foreground">Tél. : </span>
                  {sheetProspect.telephone ?? "—"}
                </div>
                <div role="paragraph" className="whitespace-normal break-words">
                  <span className="text-muted-foreground">Entreprise : </span>
                  {sheetProspect.entreprise ?? "—"}
                </div>
                {sheetProspect.titre ? (
                  <div role="paragraph" className="whitespace-normal break-words">
                    <span className="text-muted-foreground">Poste : </span>
                    {sheetProspect.titre}
                  </div>
                ) : null}
                <div role="paragraph" className="whitespace-normal break-words">
                  <span className="text-muted-foreground">Secteur : </span>
                  {sheetProspect.secteur ?? "—"}
                </div>
                <CrmContactsApolloFields prospect={sheetProspect} />
                <div
                  role="paragraph"
                  className="flex flex-wrap items-center gap-2 whitespace-normal break-words"
                >
                  <span className="text-muted-foreground">Statut :</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "w-fit font-normal",
                      CRM_STATUT_BADGE_CLASS[sheetProspect.statut] ?? "border-border",
                    )}
                  >
                    {CRM_PROSPECT_STATUT_LABELS[sheetProspect.statut as CrmProspectStatut] ??
                      sheetProspect.statut}
                  </Badge>
                </div>
                <div>
                  <div role="paragraph" className="text-muted-foreground">
                    Notes actuelles
                  </div>
                  <div role="paragraph" className="whitespace-normal break-words">
                    {sheetProspect.notes?.trim() ? sheetProspect.notes : "—"}
                  </div>
                </div>
              </div>

              {hasPermission("crm.write") ? (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <div
                    role="paragraph"
                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Ajouter une note
                  </div>
                  <Textarea
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    rows={3}
                    placeholder="Texte de la note…"
                    className="whitespace-normal break-words"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={quickNoteBusy}
                    onClick={() => void onSubmitQuickNote()}
                  >
                    {quickNoteBusy ? "Envoi…" : "Ajouter la note"}
                  </Button>
                  <div className="border-t border-border pt-3">
                    <div
                      role="paragraph"
                      className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      Enregistrer une interaction
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <Select
                        value={quickEventKind}
                        onValueChange={(v) => setQuickEventKind(v as CrmContactEventKind)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CRM_CONTACT_EVENT_KINDS.map((k) => (
                            <SelectItem key={k} value={k}>
                              {CRM_CONTACT_EVENT_KIND_LABELS[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={quickEventBusy}
                        onClick={() => void onSubmitQuickContactEvent()}
                      >
                        {quickEventBusy ? "…" : "Enregistrer"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <div
                  role="paragraph"
                  className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Journal
                </div>
                <ul className="max-h-[min(50vh,24rem)] space-y-3 overflow-y-auto pr-1">
                  {sheetTimeline.length === 0 ? (
                    <li className="text-sm text-muted-foreground">Aucune entrée pour l’instant.</li>
                  ) : (
                    sheetTimeline.map((ev) => (
                      <li
                        key={`${ev.type}-${ev.id}`}
                        className="rounded-md border border-border/80 p-2 text-sm"
                      >
                        <div className="text-xs text-muted-foreground">
                          {formatTimelineAt(ev.at)}
                          {ev.userName ? ` — ${ev.userName}` : ""}
                        </div>
                        {ev.type === "status_change" ? (
                          <div role="paragraph" className="mt-1 whitespace-normal break-words">
                            Statut :{" "}
                            {ev.oldStatus
                              ? `${CRM_PROSPECT_STATUT_LABELS[ev.oldStatus as CrmProspectStatut] ?? ev.oldStatus} → `
                              : ""}
                            {CRM_PROSPECT_STATUT_LABELS[ev.newStatus as CrmProspectStatut] ??
                              ev.newStatus}
                          </div>
                        ) : null}
                        {ev.type === "note" ? (
                          <div role="paragraph" className="mt-1 whitespace-normal break-words">
                            {ev.body}
                          </div>
                        ) : null}
                        {ev.type === "contact_event" ? (
                          <div role="paragraph" className="mt-1 whitespace-normal break-words">
                            Interaction :{" "}
                            {CRM_CONTACT_EVENT_KIND_LABELS[ev.kind as CrmContactEventKind] ??
                              ev.kind}
                            {ev.metadata && Object.keys(ev.metadata).length > 0
                              ? ` — ${JSON.stringify(ev.metadata)}`
                              : ""}
                          </div>
                        ) : null}
                        {ev.type === "audit" ? (
                          <div className="mt-1 whitespace-normal break-words">
                            <span className="font-medium">
                              {ev.action === "fields_update"
                                ? "Champs mis à jour"
                                : ev.action === "create"
                                  ? "Création"
                                  : ev.action}
                            </span>
                            {ev.payload ? (
                              <pre className="mt-1 overflow-x-auto rounded bg-muted/50 p-2 text-xs">
                                {JSON.stringify(ev.payload, null, 2)}
                              </pre>
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {hasPermission("crm.write") ? (
                <Button type="button" variant="outline" onClick={onEditInForm}>
                  Modifier dans le formulaire…
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
