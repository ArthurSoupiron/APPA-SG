"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useUbacSession } from "@/lib/ubac-session-context";

import {
  AGENT_STATUS_OPTIONS,
  SI_TICKET_CATEGORY_LABELS,
  SI_TICKET_STATUS_LABELS,
} from "../_lib/si-ticket-status";
import {
  patchSiTicket,
  postSiComment,
  toggleSiWatcher,
  uploadSiAttachments,
} from "../_lib/si-ticket-api";
import type { SiTicketDetail, SiTicketStatus } from "../_lib/si-ticket-types";
import { SiTicketFileUpload } from "./si-ticket-file-upload";
import { SiTicketStatusBadge } from "./si-ticket-status-badge";
import { SiTicketTimeline } from "./si-ticket-timeline";

export function SiTicketDetailSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  detail: SiTicketDetail | null;
  onUpdated: (detail: SiTicketDetail) => void;
}) {
  const { hasPermission, userId } = useUbacSession();
  const isAgent = hasPermission("si.ticket.manage");
  const [comment, setComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);

  const t = props.detail?.ticket;

  async function changeStatus(status: SiTicketStatus) {
    if (!t) return;
    setStatusBusy(true);
    const next = await patchSiTicket(t.id, { status });
    setStatusBusy(false);
    if (next) props.onUpdated(next);
  }

  async function takeTicket() {
    if (!t || !userId) return;
    setStatusBusy(true);
    const next = await patchSiTicket(t.id, { assigneeUserId: userId });
    setStatusBusy(false);
    if (next) props.onUpdated(next);
  }

  async function submitComment() {
    if (!t || !comment.trim()) return;
    setCommentBusy(true);
    const next = await postSiComment(t.id, comment.trim());
    setCommentBusy(false);
    if (next) {
      setComment("");
      props.onUpdated(next);
    }
  }

  async function submitUploads() {
    if (!t || pendingUploads.length === 0) return;
    setUploadBusy(true);
    const next = await uploadSiAttachments(t.id, pendingUploads);
    setUploadBusy(false);
    if (next) {
      setPendingUploads([]);
      props.onUpdated(next);
    }
  }

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" size="wide" className="flex flex-col gap-0 overflow-hidden p-0">
        <SheetHeader className="border-b px-6 py-4 text-left">
          <SheetTitle className="font-mono text-base whitespace-normal break-words">
            {t ? t.reference : "Ticket"}
          </SheetTitle>
          <SheetDescription className="text-base text-foreground whitespace-normal break-words">
            {t?.title ?? "Chargement…"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {props.loading || !props.detail || !t ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <SiTicketStatusBadge status={t.status} />
                <Badge variant="outline">{SI_TICKET_CATEGORY_LABELS[t.category]}</Badge>
              </div>

              {isAgent ? (
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center">
                  <Select
                    value={t.status}
                    onValueChange={(v) => void changeStatus(v as SiTicketStatus)}
                    disabled={statusBusy}
                  >
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SI_TICKET_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    disabled={statusBusy}
                    onClick={() => void takeTicket()}
                  >
                    Prendre en charge
                  </Button>
                </div>
              ) : null}

              <section className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="text-sm whitespace-normal break-words">{t.description}</p>
              </section>

              {t.driveFolderUrl ? (
                <section>
                  <a
                    href={t.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-sm font-medium text-primary underline underline-offset-4"
                  >
                    Ouvrir le dossier Drive du ticket
                  </a>
                </section>
              ) : null}

              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Pièces jointes</h3>
                {props.detail.attachments.length > 0 ? (
                  <ul className="space-y-2">
                    {props.detail.attachments.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
                      >
                        {a.webViewLink ? (
                          <a
                            href={a.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline underline-offset-4 break-words"
                          >
                            {a.name}
                          </a>
                        ) : (
                          <span className="break-words">{a.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune pièce jointe enregistrée.</p>
                )}
                <SiTicketFileUpload
                  files={pendingUploads}
                  onFilesChange={setPendingUploads}
                  disabled={uploadBusy}
                  compact
                />
                {pendingUploads.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={uploadBusy}
                    onClick={() => void submitUploads()}
                  >
                    {uploadBusy ? <Spinner className="size-4" /> : "Envoyer les fichiers"}
                  </Button>
                ) : null}
              </section>

              <Separator />

              <section className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Historique</h3>
                <SiTicketTimeline detail={props.detail} />
              </section>

              {t.auditSnapshot && t.auditSnapshot.length > 0 ? (
                <details className="rounded-lg border bg-muted/10 px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    Journal technique (snapshot à la création)
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(t.auditSnapshot, null, 2)}
                  </pre>
                </details>
              ) : null}

              <Separator />

              <section className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Commentaire</h3>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Votre message…"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={commentBusy || !comment.trim()}
                  onClick={() => void submitComment()}
                >
                  {commentBusy ? <Spinner className="size-4" /> : "Envoyer"}
                </Button>
              </section>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void toggleSiWatcher(t.id, true)}
              >
                Suivre ce ticket
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
