"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUbacSession } from "@/lib/ubac-session-context";

import { SiRecoveryButton } from "./si-recovery-button";
import { SiTicketsView } from "./si-tickets-view";

type SiTab = "tickets" | "manage";

export function SiHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useUbacSession();
  const canManage = hasPermission("si.ticket.manage");

  const tabFromUrl = searchParams.get("tab") === "manage" ? "manage" : "tickets";
  const [tab, setTab] = useState<SiTab>(canManage ? tabFromUrl : "tickets");

  useEffect(() => {
    if (!canManage && tab === "manage") setTab("tickets");
  }, [canManage, tab]);

  useEffect(() => {
    setTab(tabFromUrl === "manage" && canManage ? "manage" : "tickets");
  }, [tabFromUrl, canManage]);

  const onTabChange = useCallback(
    (value: string) => {
      const next = value === "manage" ? "manage" : "tickets";
      setTab(next);
      const path = next === "manage" ? "/si?tab=manage" : "/si";
      router.replace(path, { scroll: false });
    },
    [router],
  );

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="flex min-h-0 flex-1 flex-col gap-4">
      <TabsList
        className={
          canManage
            ? "h-auto w-full max-w-md grid grid-cols-2"
            : "h-auto w-full max-w-xs"
        }
      >
        <TabsTrigger value="tickets">Mes tickets</TabsTrigger>
        {canManage ? <TabsTrigger value="manage">Panel agents</TabsTrigger> : null}
      </TabsList>

      <TabsContent value="tickets" className="mt-0 min-h-0 flex-1">
        <SiTicketsView
          title="Mes tickets"
          subtitle="Créez un ticket, décrivez votre problème et joignez des documents. L’équipe SI vous répondra via ce fil."
          embedded
        />
      </TabsContent>

      {canManage ? (
        <TabsContent value="manage" className="mt-0 min-h-0 flex-1">
          <SiTicketsView
            title="Panel SI"
            subtitle="Vue globale des tickets, attribution et changement de statut."
            manageMode
            recoveryAction={<SiRecoveryButton />}
            embedded
          />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
