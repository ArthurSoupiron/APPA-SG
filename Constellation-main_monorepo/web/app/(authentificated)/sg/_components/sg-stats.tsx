"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useSgBase } from "../_lib/sg-base";
import {
  conformityScore,
  dossierStats,
  rollups,
  statsByPole,
  statsByStatus,
  statsDocStatus,
  statsPieces,
  useSg,
} from "../_lib/sg-store";
import { exportMembersCSV } from "../_lib/sg-utils";

const STATUS_DOT: Record<string, string> = {
  ok: "bg-primary",
  warn: "bg-amber-400",
  info: "bg-blue-400",
  danger: "bg-destructive",
};

export function SgStats() {
  const { data } = useSg();
  const base = useSgBase();
  const router = useRouter();

  const r = rollups(data);
  const byPole = statsByPole(data);
  const byStatus = statsByStatus(data);
  const pieces = statsPieces(data);
  const docStatus = statsDocStatus(data);

  const avgCompletion = Math.round(
    data.members.reduce((a, m) => a + dossierStats(data, m).pct, 0) / Math.max(1, data.members.length),
  );

  const kpis = [
    { label: "Membres", value: r.membersTotal },
    { label: "Complétude moyenne", value: `${avgCompletion}%` },
    { label: "Documents GED", value: data.docs.length },
    { label: "Conformité", value: `${conformityScore(data)}%` },
  ];

  const pieceSeg = [
    { k: "Présentes", v: pieces.ok, c: "bg-primary" },
    { k: "En attente", v: pieces.pending, c: "bg-amber-400" },
    { k: "Manquantes", v: pieces.missing, c: "bg-destructive" },
  ];

  const docSeg = [
    { k: "Signés", v: docStatus.signed },
    { k: "À signer", v: docStatus.pending },
    { k: "Archivés", v: docStatus.archived },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportMembersCSV(data)}>
          Exporter (CSV)
        </Button>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Complétude par pôle */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Complétude moyenne par pôle</CardTitle>
            <p className="text-xs text-muted-foreground">Part des pièces requises présentes</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {byPole.map((p) => (
              <div key={p.pole}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {p.pole} <span className="text-muted-foreground">· {p.count} membre(s)</span>
                  </span>
                  <span className="font-semibold tabular-nums">{p.avg}%</span>
                </div>
                <Progress value={p.avg} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Répartition des statuts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition des statuts</CardTitle>
            <p className="text-xs text-muted-foreground">{r.membersTotal} membres</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {byStatus.map((s) => (
              <button
                key={s.status}
                type="button"
                onClick={() => router.push(`${base}/membres`)}
                className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-muted/60"
              >
                <span className={`size-2.5 rounded-sm ${STATUS_DOT[s.tone] ?? "bg-muted-foreground"}`} />
                <span className="flex-1 text-sm">{s.label}</span>
                <Progress
                  value={Math.round((s.count / Math.max(1, r.membersTotal)) * 100)}
                  className="h-1.5 w-24"
                />
                <span className="w-6 text-right text-sm font-semibold tabular-nums">{s.count}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* État des pièces */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">État des pièces (tous dossiers)</CardTitle>
            <p className="text-xs text-muted-foreground">{pieces.total} pièces requises suivies</p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex h-4 overflow-hidden rounded-full">
              {pieceSeg.map(
                (s) =>
                  s.v > 0 && (
                    <div
                      key={s.k}
                      className={s.c}
                      style={{ width: `${(s.v / Math.max(1, pieces.total)) * 100}%` }}
                      title={`${s.k}: ${s.v}`}
                    />
                  ),
              )}
            </div>
            {pieceSeg.map((s) => (
              <div key={s.k} className="flex items-center gap-2 py-1 text-sm">
                <span className={`size-2 rounded-sm ${s.c}`} />
                <span className="flex-1 text-muted-foreground">{s.k}</span>
                <span className="font-semibold">{s.v}</span>
                <span className="w-11 text-right text-muted-foreground">
                  {Math.round((s.v / Math.max(1, pieces.total)) * 100)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* GED par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents GED par statut</CardTitle>
            <p className="text-xs text-muted-foreground">{data.docs.length} documents</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {docSeg.map((s) => (
              <div key={s.k}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{s.k}</span>
                  <span className="font-semibold tabular-nums">{s.v}</span>
                </div>
                <Progress value={(s.v / Math.max(1, data.docs.length)) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
