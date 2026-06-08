"use client";

import { type ReactNode, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import {
  deleteAgendaEvent,
  patchAgendaEvent,
  patchAgendaRsvp,
  postAgendaComment,
  syncAgendaGoogleRsvp,
} from "../_lib/agenda-api";
import {
  AGENDA_AUDIENCE_LABELS,
  AGENDA_POLE_LABELS,
  AGENDA_RSVP_LABELS,
  AGENDA_STATUS_LABELS,
  formatAgendaAudienceGroup,
  formatAgendaEventRange,
} from "../_lib/agenda-pole-labels";
import type { AgendaEventDetail, AgendaRsvpStatus } from "../_lib/agenda-types";

function DetailSection(props: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{props.title}</h3>
      {props.children}
    </section>
  );
}

function MetaRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-3">
      <span className="text-sm text-muted-foreground">{props.label}</span>
      <span className="text-sm whitespace-normal break-words">{props.children}</span>
    </div>
  );
}

export function AgendaEventDetailSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  detail: AgendaEventDetail | null;
  onUpdated: (detail: AgendaEventDetail) => void;
  onDeleted: () => void;
}) {
  const [comment, setComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rsvpSyncBusy, setRsvpSyncBusy] = useState(false);
  const d = props.detail;
  const hasGoogleCalendar = Boolean(d?.meetUrl);

  async function submitComment() {
    if (!d || !comment.trim()) return;
    setCommentBusy(true);
    const updated = await postAgendaComment(d.id, comment.trim());
    setCommentBusy(false);
    if (updated) {
      setComment("");
      props.onUpdated(updated);
    }
  }

  async function setRsvp(status: AgendaRsvpStatus) {
    if (!d?.myParticipant?.id) return;
    const updated = await patchAgendaRsvp(d.id, d.myParticipant.id, status);
    if (updated) props.onUpdated(updated);
  }

  async function publish() {
    if (!d) return;
    const updated = await patchAgendaEvent(d.id, { status: "published" });
    if (updated) props.onUpdated(updated);
  }

  async function refreshFromGoogle() {
    if (!d) return;
    setRsvpSyncBusy(true);
    const updated = await syncAgendaGoogleRsvp(d.id);
    setRsvpSyncBusy(false);
    if (updated) props.onUpdated(updated);
  }

  async function removeEvent() {
    if (!d) return;
    setDeleting(true);
    const ok = await deleteAgendaEvent(d.id);
    setDeleting(false);
    if (ok) {
      props.onOpenChange(false);
      props.onDeleted();
    }
  }

  const hasActions = d
    ? (d.canEdit && d.status === "draft") || d.canDelete || Boolean(d.myParticipant)
    : false;

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" size="wide" className="flex flex-col gap-0 overflow-hidden p-0">
        <SheetHeader className="shrink-0 border-b px-6 py-4 text-left">
          <SheetTitle className="font-mono text-base whitespace-normal break-words">
            {d?.reference ?? "Événement"}
          </SheetTitle>
          <SheetDescription className="text-base font-medium text-foreground whitespace-normal break-words">
            {d?.title ?? (props.loading ? "Chargement…" : "Événement")}
          </SheetDescription>
          {d ? (
            <p className="text-sm text-muted-foreground whitespace-normal break-words">
              {formatAgendaEventRange(d.startsAt, d.endsAt, d.allDay)}
              {d.allDay ? " · Journée entière" : null}
            </p>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {props.loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : !d ? (
            <p className="text-sm text-muted-foreground">Événement introuvable.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{AGENDA_POLE_LABELS[d.pole]}</Badge>
                <Badge
                  variant="outline"
                  style={
                    d.typeColor ? { borderColor: d.typeColor, color: d.typeColor } : undefined
                  }
                >
                  {d.typeLabel}
                </Badge>
                <Badge variant="outline">{AGENDA_STATUS_LABELS[d.status]}</Badge>
              </div>

              {hasActions || hasGoogleCalendar ? (
                <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
                  {hasGoogleCalendar ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={rsvpSyncBusy}
                      onClick={() => void refreshFromGoogle()}
                    >
                      {rsvpSyncBusy ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner className="size-4" />
                          Synchronisation Google…
                        </span>
                      ) : (
                        "Actualiser les réponses depuis Google Agenda"
                      )}
                    </Button>
                  ) : null}
                  {d.myParticipant ? (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Votre réponse</Label>
                      <Select
                        value={d.myParticipant.rsvpStatus}
                        onValueChange={(v) => void setRsvp(v as AgendaRsvpStatus)}
                      >
                        <SelectTrigger className="w-full sm:max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(AGENDA_RSVP_LABELS) as AgendaRsvpStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>
                              {AGENDA_RSVP_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {d.canEdit && d.status === "draft" ? (
                      <Button type="button" size="sm" onClick={() => void publish()}>
                        Publier
                      </Button>
                    ) : null}
                    {d.canDelete ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deleting}
                          >
                            Supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
                            <AlertDialogDescription className="whitespace-normal break-words">
                              {d.reference} — {d.title} sera retiré de l’agenda et de Google
                              Calendar si un lien avait été créé.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deleting}
                              onClick={() => void removeEvent()}
                            >
                              {deleting ? "Suppression…" : "Supprimer"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {d.location ? (
                  <MetaRow label="Lieu">{d.location}</MetaRow>
                ) : null}
                {d.createdBy ? (
                  <MetaRow label="Créé par">
                    {d.createdBy.name ?? d.createdBy.email ?? "—"}
                  </MetaRow>
                ) : null}
                {d.recurrenceRule ? (
                  <MetaRow label="Récurrence">{d.recurrenceRule}</MetaRow>
                ) : null}
              </div>

              {(d.meetUrl || d.driveUrl) && (
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {d.meetUrl ? (
                    <Button variant="outline" size="sm" className="h-auto justify-start py-2" asChild>
                      <a href={d.meetUrl} target="_blank" rel="noopener noreferrer">
                        Rejoindre Google Meet
                      </a>
                    </Button>
                  ) : null}
                  {d.driveUrl ? (
                    <Button variant="outline" size="sm" className="h-auto justify-start py-2" asChild>
                      <a href={d.driveUrl} target="_blank" rel="noopener noreferrer">
                        Ouvrir le document Drive
                      </a>
                    </Button>
                  ) : null}
                </div>
              )}

              <DetailSection title="Description">
                <p className="text-sm whitespace-normal break-words">
                  {d.description || "Aucune description."}
                </p>
              </DetailSection>

              {(d.audienceGroups.length > 0 || d.audiences.length > 0) && (
                <DetailSection title="Audiences">
                  <div className="flex flex-wrap gap-1.5">
                    {d.audienceGroups.map((g) => (
                      <Badge key={g.id} variant="outline" className="whitespace-normal break-words">
                        {formatAgendaAudienceGroup(g)}
                      </Badge>
                    ))}
                    {d.audiences.map((a) => (
                      <Badge key={a} variant="outline">
                        {AGENDA_AUDIENCE_LABELS[a]}
                      </Badge>
                    ))}
                  </div>
                </DetailSection>
              )}

              <Separator />

              <DetailSection title="Participants">
                {d.participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun participant enregistré.</p>
                ) : (
                  <ul className="space-y-2">
                    {d.participants.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm"
                      >
                        <span className="whitespace-normal break-words">
                          {p.displayName ?? p.email}
                          {p.role === "organizer" ? (
                            <span className="text-muted-foreground"> · organisateur</span>
                          ) : null}
                          {p.fromAudienceGroup && p.sourceGroupName ? (
                            <span className="text-muted-foreground">
                              {" "}
                              · via {p.sourceGroupName}
                            </span>
                          ) : null}
                        </span>
                        <Badge variant="secondary" className="shrink-0">
                          {AGENDA_RSVP_LABELS[p.rsvpStatus]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </DetailSection>

              <Separator />

              <DetailSection title="Commentaires">
                {d.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun commentaire pour l’instant.</p>
                ) : (
                  <ul className="space-y-2">
                    {d.comments.map((c) => (
                      <li
                        key={c.id}
                        className="rounded-lg border bg-muted/10 p-3 whitespace-normal break-words"
                      >
                        <p className="text-xs text-muted-foreground">
                          {c.user?.name ?? c.user?.email ?? "—"} ·{" "}
                          {new Date(c.createdAt).toLocaleString("fr-FR")}
                        </p>
                        <p className="mt-1 text-sm">{c.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Ajouter un commentaire…"
                  className="mt-2"
                />
                <Button
                  type="button"
                  size="sm"
                  className="mt-2"
                  disabled={commentBusy || !comment.trim()}
                  onClick={() => void submitComment()}
                >
                  {commentBusy ? <Spinner className="size-4" /> : "Envoyer"}
                </Button>
              </DetailSection>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
