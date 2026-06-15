"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AgendaEventsView } from "@/app/(authentificated)/account/agenda/_components/agenda-events-view";
import MonGoogleDriveClient from "@/app/(authentificated)/account/mon-google-drive/mon-google-drive-client";
import { DashboardOverviewTab } from "@/components/account/dashboard-overview-tab";
import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUbacSession } from "@/lib/ubac-session-context";

type DashboardTab = "overview" | "agenda" | "drive";

const TAB_PANEL_CLASS =
  "mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-5 outline-none";

function DashboardTabs() {
  const searchParams = useSearchParams();
  const { hasPermission, loading } = useUbacSession();

  const canAgenda = hasPermission("agenda.read");
  const canDrive = hasPermission("app.overview");

  const availableTabs = useMemo(() => {
    const tabs: DashboardTab[] = ["overview"];
    if (canAgenda) tabs.push("agenda");
    if (canDrive) tabs.push("drive");
    return tabs;
  }, [canAgenda, canDrive]);

  const [tab, setTab] = useState<DashboardTab>("overview");

  useEffect(() => {
    if (!availableTabs.includes(tab)) {
      setTab("overview");
    }
  }, [availableTabs, tab]);

  useEffect(() => {
    if (searchParams.get("event") && canAgenda) {
      setTab("agenda");
    }
  }, [searchParams, canAgenda]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        if (v === "overview" || v === "agenda" || v === "drive") setTab(v);
      }}
      className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-0"
    >
      <TabsList
        variant="line"
        aria-label="Sections du tableau de bord"
        className="mb-0 h-auto w-full min-w-0 shrink-0 flex-wrap justify-start gap-x-0 gap-y-0 rounded-none border-0 border-b border-border bg-transparent p-0"
      >
        <TabsTrigger value="overview" className="shrink-0">
          Vue d&apos;ensemble
        </TabsTrigger>
        {canAgenda ? (
          <TabsTrigger value="agenda" className="shrink-0">
            Agenda
          </TabsTrigger>
        ) : null}
        {canDrive ? (
          <TabsTrigger value="drive" className="shrink-0">
            Mon Google Drive
          </TabsTrigger>
        ) : null}
      </TabsList>

      <TabsContent value="overview" className={TAB_PANEL_CLASS}>
        <DashboardOverviewTab />
      </TabsContent>

      {canAgenda ? (
        <TabsContent value="agenda" className={TAB_PANEL_CLASS}>
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
            <AgendaEventsView embedded hideTitle />
          </div>
        </TabsContent>
      ) : null}

      {canDrive ? (
        <TabsContent value="drive" className={TAB_PANEL_CLASS}>
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
            <MonGoogleDriveClient embedded hideTitle />
          </div>
        </TabsContent>
      ) : null}
    </Tabs>
  );
}

export default function AccountDashboardClient() {
  return (
    <AccountPageMain className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="shrink-0 space-y-1">
        <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Tableau de bord" />
        <PretextBlock
          as="p"
          metric={PRETEXT.sm}
          text="Vue d’ensemble, agenda organisationnel et drives partagés."
          className="text-muted-foreground"
        />
      </header>

      <Suspense
        fallback={
          <div className="flex flex-1 justify-center py-16">
            <Spinner />
          </div>
        }
      >
        <DashboardTabs />
      </Suspense>
    </AccountPageMain>
  );
}
