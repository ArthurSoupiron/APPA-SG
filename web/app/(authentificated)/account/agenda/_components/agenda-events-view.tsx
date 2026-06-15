"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useUbacSession } from "@/lib/ubac-session-context";

import {
  configureAgendaGoogleSync,
  exportAgendaSheet,
  fetchAgendaEventDetail,
  fetchAgendaEvents,
  syncAgendaGoogleRsvp,
} from "../_lib/agenda-api";
import { AGENDA_POLE_LABELS } from "../_lib/agenda-pole-labels";
import type { AgendaEventDetail, AgendaEventListItem, AgendaPole } from "../_lib/agenda-types";
import { AgendaEventCreateDialog } from "./agenda-event-create-dialog";
import { AgendaEventDetailSheet } from "./agenda-event-detail-sheet";
import { AgendaEventList } from "./agenda-event-list";

const POLES = Object.keys(AGENDA_POLE_LABELS) as AgendaPole[];

export function AgendaEventsView(
  props: { embedded?: boolean; hideTitle?: boolean } = {},
) {
  const { hasPermission, isSuperAdmin } = useUbacSession();
  const searchParams = useSearchParams();
  const canWriteAny = POLES.some(
    (p) => hasPermission(`${p}.agenda.write`) || hasPermission(`${p}.agenda.manage`),
  );

  const [q, setQ] = useState("");
  const [pole, setPole] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [events, setEvents] = useState<AgendaEventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [detail, setDetail] = useState<AgendaEventDetail | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const from = new Date(now);
    from.setMonth(from.getMonth() - 1);
    const to = new Date(now);
    to.setMonth(to.getMonth() + 6);
    const rows = await fetchAgendaEvents({
      q,
      pole: (pole || undefined) as AgendaPole | undefined,
      status: status || undefined,
      from: from.toISOString(),
      to: to.toISOString(),
    });
    setEvents(rows);
    setLoading(false);
  }, [q, pole, status]);

  useEffect(() => {
    const t = setTimeout(() => void reload(), 200);
    return () => clearTimeout(t);
  }, [reload]);

  const openEvent = useCallback(async (id: string) => {
    setSheetOpen(true);
    setSheetLoading(true);
    setDetail(null);
    let d = await fetchAgendaEventDetail(id);
    if (d?.meetUrl) {
      d = (await syncAgendaGoogleRsvp(id)) ?? d;
    }
    setDetail(d);
    setSheetLoading(false);
  }, []);

  useEffect(() => {
    const eventId = searchParams.get("event");
    if (eventId) void openEvent(eventId);
  }, [searchParams, openEvent]);

  const content = (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {props.hideTitle ? (
          <PretextBlock
            as="p"
            metric={PRETEXT.sm}
            text="Calendrier organisationnel multi-pôles — liste chronologique."
            className="min-w-0 flex-1 text-muted-foreground whitespace-normal break-words"
          />
        ) : (
          <div className="space-y-1">
            <PretextBlock
              as={props.embedded ? "h2" : "h1"}
              metric={props.embedded ? PRETEXT.smMedium : PRETEXT.h1Page}
              text="Agenda"
            />
            <PretextBlock
              as="p"
              metric={PRETEXT.xs}
              text="Calendrier organisationnel multi-pôles — liste chronologique."
              className="text-sm text-muted-foreground whitespace-normal break-words"
            />
          </div>
        )}
        <div className="flex shrink-0 flex-wrap gap-2">
          {canWriteAny ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              Nouvel événement
            </Button>
          ) : null}
          {isSuperAdmin ? (
            <Button type="button" variant="outline" onClick={() => void exportAgendaSheet()}>
              Export Sheet
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => void configureAgendaGoogleSync(true)}
          >
            Sync Google
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Input
          placeholder="Rechercher…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={pole || "all"} onValueChange={(v) => setPole(v === "all" ? "" : v)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Pôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les pôles</SelectItem>
            {POLES.map((p) => (
              <SelectItem key={p} value={p}>
                {AGENDA_POLE_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="published">Publié</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <AgendaEventList events={events} onOpen={(id) => void openEvent(id)} />
      )}

      <AgendaEventCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(d) => {
          void reload();
          void openEvent(d.id);
        }}
      />

      <AgendaEventDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        loading={sheetLoading}
        detail={detail}
        onUpdated={(d) => {
          setDetail(d);
          void reload();
        }}
        onDeleted={() => {
          setDetail(null);
          void reload();
        }}
      />
    </>
  );

  if (props.embedded) {
    return <div className="flex min-h-0 flex-1 flex-col gap-5">{content}</div>;
  }

  return <AccountPageMain className="space-y-6">{content}</AccountPageMain>;
}
