"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  conformityOpen,
  conformityScore,
  deadlineInfo,
  dossierStats,
  gedCount,
  rollups,
  useSg,
} from "../_lib/sg-store";
import { useSgBase } from "../_lib/sg-base";
import { CompletenessBar, DocDots, SgAvatar } from "./sg-bits";

const TONE_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  warn: "secondary",
  info: "outline",
  danger: "destructive",
  neutral: "outline",
};

export function SgDashboard() {
  const { data } = useSg();
  const base = useSgBase();
  const r = rollups(data);
  const incomplete = r.incomplete.filter((m) => m.status !== "alumni").slice(0, 5);

  const dist = data.gedCats
    .map((c) => ({ label: c.label, v: gedCount(data, c.id) }))
    .filter((d) => d.v > 0)
    .sort((a, b) => b.v - a.v);
  const distMax = Math.max(1, ...dist.map((d) => d.v));

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Membres centralisés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{r.membersTotal}</div>
            <p className="text-xs text-muted-foreground">{r.active} actifs · {r.pending} postulants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Dossiers complets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{r.completePct}%</div>
            <p className="text-xs text-muted-foreground">{r.complete}/{r.membersTotal} conformes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Documents stockés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{data.docs.length}</div>
            <p className="text-xs text-muted-foreground">GED · cloud chiffré</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Conformité CNJE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{conformityScore(data)}%</div>
            <p className="text-xs text-muted-foreground">{conformityOpen(data)} point(s) à régulariser</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Dossiers à compléter */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Dossiers à compléter</CardTitle>
            <Link href={`${base}/membres`} className="text-sm text-primary hover:underline">
              Tout voir
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {incomplete.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">Tous les dossiers actifs sont complets ✅</p>
            )}
            {incomplete.map((m) => {
              const s = dossierStats(data, m);
              return (
                <Link
                  key={m.id}
                  href={`${base}/membres/${m.id}`}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
                >
                  <SgAvatar member={m} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{m.first} {m.last}</div>
                    <div className="truncate text-xs text-muted-foreground">{m.role} · {m.pole}</div>
                  </div>
                  <DocDots member={m} docTypes={data.docTypes} />
                  <CompletenessBar pct={s.pct} />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Échéances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Échéances de conformité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.deadlines.map((d) => {
              const info = deadlineInfo(d.date);
              return (
                <div key={d.id} className="flex items-center gap-3">
                  <div className="flex w-11 shrink-0 flex-col items-center rounded-md border border-border py-1">
                    <span className="text-base font-bold leading-none">{info.day}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{info.mo}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{d.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{d.sub}</div>
                  </div>
                  <Badge variant={TONE_BADGE[info.tone] ?? "outline"}>{info.delta}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Répartition GED */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition de la GED</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dist.map((d) => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{d.label}</span>
                  <span className="font-semibold tabular-nums text-muted-foreground">{d.v}</span>
                </div>
                <Progress value={(d.v / distMax) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activité */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Activité récente</CardTitle>
            <Link href={`${base}/journal`} className="text-sm text-primary hover:underline">
              Journal complet
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activity.slice(0, 6).map((a, i) => {
              const who = data.members.find((m) => m.id === a.who);
              return (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {who && <SgAvatar member={who} size={26} />}
                  <div className="min-w-0">
                    <span className="font-medium">{who ? `${who.first} ${who.last}` : a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    <span className="font-medium">{a.target}</span>
                    <div className="text-xs text-muted-foreground">{a.ctx} · {a.when}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
