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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RankRow = {
  userId: string;
  userName: string;
  email: string;
  total: number;
  transforme: number;
  rdvConfirme: number;
};

export function CrmSectionKpiGlobal() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<Record<string, unknown> | null>(null);
  const [ranking, setRanking] = useState<RankRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/app/crm/kpi/global", { credentials: "include" });
      if (res.status === 403) {
        toast.error("Permission refusée (crm.kpi.global).");
        return;
      }
      if (!res.ok) {
        toast.error("Chargement impossible.");
        return;
      }
      const json: { totals?: Record<string, unknown>; ranking?: RankRow[] } = await res.json();
      setTotals(json.totals ?? null);
      setRanking(json.ranking ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const funnel = (totals?.funnel as { label: string; count: number }[]) ?? [];

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="flex flex-col gap-2 border-b border-brand/25 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PretextBlock as="h2" metric={PRETEXT.smMedium} text="KPI & équipe" />
          <PretextBlock
            as="p"
            metric={PRETEXT.xs}
            text="Indicateurs globaux et classement des contributeurs."
            className="mt-1 text-muted-foreground"
          />
        </div>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Actualiser
        </Button>
      </div>

      {totals ? (
        <Card className="border-brand/15 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
              {[
                { k: "total", label: "Total assignés" },
                { k: "transforme", label: "Transformés" },
                { k: "rdvConfirme", label: "RDV confirmés" },
                { k: "tauxReponse", label: "Taux réponse %" },
              ].map(({ k, label }) => (
                <div key={k} className="bg-background p-3">
                  <div
                    role="paragraph"
                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {label}
                  </div>
                  <div role="paragraph" className="mt-1 text-lg font-semibold tabular-nums">
                    {String(totals[k] ?? "—")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-brand/15">
        <CardHeader className="border-b border-border/50 pb-3">
          <PretextBlock as="h3" metric={PRETEXT.smMedium} text="Funnel global" />
        </CardHeader>
        <CardContent className="h-[300px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis
                dataKey="label"
                tick={{ ...chartAxisTick, fontSize: 10 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={70}
                stroke={chartGridStroke}
              />
              <YAxis tick={chartAxisTick} stroke={chartGridStroke} />
              <Tooltip contentStyle={crmChartTooltipStyle()} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {funnel.map((_, i) => (
                  <Cell key={i} fill={CRM_CHART_HEX[i % CRM_CHART_HEX.length]!} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-brand/15">
        <CardHeader className="border-b border-border/50 pb-3">
          <PretextBlock as="h3" metric={PRETEXT.smMedium} text="Classement" />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead className="text-end">Assignés</TableHead>
                <TableHead className="text-end">RDV</TableHead>
                <TableHead className="text-end">Transformés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aucune donnée d’assignation.
                  </TableCell>
                </TableRow>
              ) : (
                ranking.map((r, i) => (
                  <TableRow key={r.userId}>
                    <TableCell>
                      <span className="text-muted-foreground mr-2">#{i + 1}</span>
                      {r.userName}
                      <div className="text-muted-foreground text-xs">{r.email}</div>
                    </TableCell>
                    <TableCell className="text-end">{r.total}</TableCell>
                    <TableCell className="text-end">{r.rdvConfirme}</TableCell>
                    <TableCell className="text-end">{r.transforme}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
