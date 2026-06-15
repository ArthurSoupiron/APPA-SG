"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useUbacSession } from "@/lib/ubac-session-context";

import { fetchSiTicketDetail, fetchSiTickets } from "../_lib/si-ticket-api";
import type { SiTicketDetail, SiTicketListItem } from "../_lib/si-ticket-types";
import { SiGoogleIntegrationBanner } from "./si-google-integration-banner";
import { SiNotificationBell } from "./si-notification-bell";
import { useSiTicketCreate, useSiTicketOnCreated } from "./si-ticket-create-provider";
import { SiTicketDetailSheet } from "./si-ticket-detail-sheet";
import { SiTicketFilters } from "./si-ticket-filters";
import { SiTicketList } from "./si-ticket-list";

export function SiTicketsView(props: {
  title: string;
  subtitle: string;
  manageMode?: boolean;
  recoveryAction?: ReactNode;
  /** Intégré dans /si (sans wrapper page dupliqué) */
  embedded?: boolean;
}) {
  const { hasPermission } = useUbacSession();
  const canManage = hasPermission("si.ticket.manage");
  const { openCreateTicket } = useSiTicketCreate();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [tickets, setTickets] = useState<SiTicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [detail, setDetail] = useState<SiTicketDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await fetchSiTickets({
      q,
      status: status || undefined,
      manage: props.manageMode && canManage,
    });
    setTickets(rows);
    setLoading(false);
  }, [q, status, props.manageMode, canManage]);

  useEffect(() => {
    const t = setTimeout(() => void reload(), 200);
    return () => clearTimeout(t);
  }, [reload]);

  const openTicket = useCallback(async (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
    setSheetLoading(true);
    setDetail(null);
    const d = await fetchSiTicketDetail(id);
    setDetail(d);
    setSheetLoading(false);
  }, []);

  useSiTicketOnCreated(
    useCallback((d) => {
      void openTicket(d.ticket.id);
      void reload();
    }, [openTicket, reload]),
  );

  const content = (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <PretextBlock as="h1" metric={PRETEXT.h1Page} text={props.title} />
          <PretextBlock
            as="p"
            metric={PRETEXT.xs}
            text={props.subtitle}
            className="text-sm text-muted-foreground whitespace-normal break-words"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SiNotificationBell onOpenTicket={(id) => void openTicket(id)} />
          {!props.manageMode ? (
            <Button type="button" onClick={() => openCreateTicket()}>
              Nouveau ticket
            </Button>
          ) : null}
          {props.recoveryAction}
        </div>
      </div>

      <SiGoogleIntegrationBanner />

      <SiTicketFilters q={q} onQChange={setQ} status={status} onStatusChange={setStatus} />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <SiTicketList
          tickets={tickets}
          showAssignee={props.manageMode}
          showCreator={props.manageMode}
          onSelect={(id) => void openTicket(id)}
        />
      )}

      <SiTicketDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        loading={sheetLoading}
        detail={detail}
        onUpdated={(d) => {
          setDetail(d);
          void reload();
        }}
      />
    </>
  );

  if (props.embedded) {
    return <div className="space-y-6">{content}</div>;
  }

  return <AccountPageMain className="space-y-6">{content}</AccountPageMain>;
}
