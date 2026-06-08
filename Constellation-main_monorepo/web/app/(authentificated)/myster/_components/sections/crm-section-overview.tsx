"use client";

import { CrmDayPickerField } from "@myster/_components/crm-day-picker-field";
import { useCrmProspectionNav } from "@myster/_components/crm-prospection-nav-context";
import { localYmdToUtcIsoEnd, localYmdToUtcIsoStart } from "@myster/_lib/crm-day";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import type { CrmOverviewDashCharts } from "./crm-section-overview-charts";
import { CrmSectionOverviewCharts } from "./crm-section-overview-charts";
import type { CrmOverviewDashPanels } from "./crm-section-overview-panels";
import { CrmSectionOverviewPanels } from "./crm-section-overview-panels";

type CrmOverviewDash = CrmOverviewDashCharts & CrmOverviewDashPanels;

export function CrmSectionOverview() {
  const { openSprint } = useCrmProspectionNav();
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dash, setDash] = useState<CrmOverviewDash | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) {
        const iso = localYmdToUtcIsoStart(from);
        if (iso) params.set("from", iso);
      }
      if (to) {
        const iso = localYmdToUtcIsoEnd(to);
        if (iso) params.set("to", iso);
      }
      const q = params.toString();
      const res = await fetch(`/api/app/crm/kpi/dashboard${q ? `?${q}` : ""}`, {
        credentials: "include",
      });
      if (res.status === 403) {
        toast.error("Permission refusée (crm.kpi.global).");
        return;
      }
      if (!res.ok) {
        toast.error("Chargement impossible.");
        return;
      }
      setDash(await res.json());
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !dash) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-2">
      <div className="flex flex-col gap-2 border-b border-border pb-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <PretextBlock as="h2" metric={PRETEXT.smMedium} text="Pilotage activité" />
          <PretextBlock
            as="p"
            metric={PRETEXT.xs}
            text="Courbes, parts de marché internes, performers et relances."
            className="mt-0.5 text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <CrmDayPickerField
            className="w-44 shrink-0"
            id="d-from"
            label="Du"
            value={from}
            onChange={setFrom}
          />
          <CrmDayPickerField
            className="w-44 shrink-0"
            id="d-to"
            label="Au"
            value={to}
            onChange={setTo}
          />
          <Button type="button" onClick={() => void load()}>
            Appliquer
          </Button>
        </div>
      </div>

      <CrmSectionOverviewCharts dash={dash} />
      <CrmSectionOverviewPanels dash={dash} onOpenSprint={openSprint} />
    </div>
  );
}
