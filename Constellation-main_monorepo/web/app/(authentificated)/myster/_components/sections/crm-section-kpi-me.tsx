"use client";

import {
  CRM_CHART_HEX,
  chartAxisTick,
  chartGridStroke,
  crmChartTooltipStyle,
} from "@myster/_lib/crm-chart-theme";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function CrmSectionKpiMe() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/app/crm/kpi/me", { credentials: "include" });
      if (res.status === 403) {
        toast.error("Permission refusée (crm.kpi.read).");
        return;
      }
      if (!res.ok) {
        toast.error("Chargement impossible.");
        return;
      }
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const funnel = (data.funnel as { label: string; count: number }[]) ?? [];

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="flex flex-col gap-2 border-b border-brand/25 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PretextBlock as="h2" metric={PRETEXT.smMedium} text="Mes KPI" />
          <PretextBlock
            as="p"
            metric={PRETEXT.xs}
            text="Prospects qui vous sont assignés dans les sprints."
            className="mt-1 text-muted-foreground"
          />
        </div>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Actualiser
        </Button>
      </div>

      <Card className="border-brand/15 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
            {[
              { k: "aContacter", label: "À contacter" },
              { k: "aRecontacter", label: "À recontacter" },
              { k: "contacte", label: "Contactés" },
              { k: "rdvConfirme", label: "RDV confirmés" },
              { k: "enCours", label: "En cours" },
              { k: "transforme", label: "Transformés" },
              { k: "tauxReponse", label: "Taux réponse %" },
              { k: "tauxTransformation", label: "Taux transformation %" },
            ].map(({ k, label }) => (
              <div key={k} className="bg-background p-3">
                <div
                  role="paragraph"
                  className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {label}
                </div>
                <div role="paragraph" className="mt-1 text-lg font-semibold tabular-nums">
                  {String(data[k] ?? "—")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-brand/15">
        <CardHeader className="border-b border-border/50 pb-3">
          <PretextBlock as="h3" metric={PRETEXT.smMedium} text="Funnel de conversion" />
        </CardHeader>
        <CardContent className="h-[320px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis type="number" tick={chartAxisTick} stroke={chartGridStroke} />
              <YAxis
                dataKey="label"
                type="category"
                width={120}
                tick={{ ...chartAxisTick, fontSize: 11 }}
                stroke={chartGridStroke}
              />
              <Tooltip contentStyle={crmChartTooltipStyle()} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {funnel.map((_, i) => (
                  <Cell key={i} fill={CRM_CHART_HEX[i % CRM_CHART_HEX.length]!} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
