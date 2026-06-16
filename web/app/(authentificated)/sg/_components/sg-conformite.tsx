"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { uploadSgFileToDrive } from "../_lib/sg-api";
import { conformityScore, deadlineInfo, mutations, rollups, useSg } from "../_lib/sg-store";
import { buildConformiteCsv, buildDeadlinesCsv, downloadBlob } from "../_lib/sg-utils";
import { Ring } from "./sg-bits";
import type { CheckState } from "../_lib/sg-types";

const STATE_META: Record<CheckState, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  ok: { label: "Conforme", variant: "default" },
  pending: { label: "En cours", variant: "secondary" },
  todo: { label: "À faire", variant: "destructive" },
};
const STATE_LABEL: Record<CheckState, string> = { ok: "Conforme", pending: "En cours", todo: "À faire" };
const TONE_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  warn: "secondary", info: "outline", danger: "destructive", neutral: "outline",
};

export function SgConformite() {
  const { data, mutate } = useSg();
  const r = rollups(data);
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  const dossierCheck = {
    id: "__dossiers",
    k: "Dossiers membres complets",
    s: `${r.complete}/${r.membersTotal} conformes · ${r.incomplete.length} à régulariser`,
    state: (r.incomplete.length ? "pending" : "ok") as CheckState,
    computed: true,
  };
  const checks = [...data.conformite.map((c) => ({ ...c, computed: false })), dossierCheck];
  const okCount = checks.filter((c) => c.state === "ok").length;
  const pct = conformityScore(data);

  const downloadReport = () => {
    const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const rows = checks.map((c) => `<tr><td>${c.k}</td><td>${c.s ?? ""}</td><td>${STATE_LABEL[c.state]}</td></tr>`).join("");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport de conformité</title>
      <style>body{font-family:Georgia,serif;max-width:760px;margin:40px auto;padding:0 32px;color:#14271C}
      h1{font-size:20px}table{width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12.5px}
      th{text-align:left;background:#EBF9F0;color:#0F6E39;padding:8px}td{padding:8px;border-bottom:1px solid #e4ece6}</style></head><body>
      <h1>JEECE — Rapport de conformité</h1><p>Paris, le ${today} · Score : ${pct}% (${okCount}/${checks.length})</p>
      <table><thead><tr><th>Obligation</th><th>Détail</th><th>État</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    downloadBlob(`rapport-conformite-${new Date().toISOString().slice(0, 10)}.html`, html, "text/html;charset=utf-8");
    toast.success("Rapport téléchargé");
  };

  const runAudit = () => {
    const open = checks.length - okCount;
    toast[open ? "warning" : "success"](open ? `Audit : ${open} point(s) à régulariser` : "Audit : tout est conforme ✅");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Suivi des obligations légales · label CNJE</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadReport}>Rapport de conformité</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const up = await uploadSgFileToDrive("conformite-jeece-sg.csv", buildConformiteCsv(data));
              up ? toast.success("Conformité exportée vers Drive") : toast.error("Export Drive impossible (Drive lié ?).");
            }}
          >
            Exporter vers Drive
          </Button>
          <Button size="sm" onClick={runAudit}>Lancer un audit</Button>
        </div>
      </div>

      {/* score */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Ring pct={pct} size={64} />
            <div>
              <div className="text-sm font-medium">Score global</div>
              <div className="text-xs text-muted-foreground">{okCount}/{checks.length} points conformes</div>
            </div>
          </CardContent>
        </Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Dossiers conformes</div><div className="text-2xl font-semibold">{r.completePct}%</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Documents à signer</div><div className="text-2xl font-semibold">{data.docs.filter((d) => d.status === "pending").length}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Échéances &lt; 30j</div><div className="text-2xl font-semibold">{data.deadlines.filter((d) => { const i = deadlineInfo(d.date); return i.days >= 0 && i.days <= 30; }).length}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* checklist */}
        <Card>
          <CardHeader><CardTitle className="text-base">Checklist de conformité</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {checks.map((c) => {
              const meta = STATE_META[c.state];
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{c.k}</div>
                    <div className="text-xs text-muted-foreground">{c.s}</div>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  {c.state !== "ok" && !c.computed && (
                    <Button size="sm" variant="outline" onClick={() => mutate(mutations.advanceCheck(c.id))}>Traiter</Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* échéances */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Prochaines échéances</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const up = await uploadSgFileToDrive("echeances-jeece-sg.csv", buildDeadlinesCsv(data));
                  up ? toast.success("Échéances exportées vers Drive") : toast.error("Export Drive impossible (Drive lié ?).");
                }}
              >
                Exporter vers Drive
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDeadlineOpen(true)}>Ajouter</Button>
            </div>
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
                    <div className="truncate text-xs text-muted-foreground"><Badge variant="outline" className="mr-1">{d.kind}</Badge>{d.sub}</div>
                  </div>
                  <Badge variant={TONE_BADGE[info.tone] ?? "outline"}>{info.delta}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => mutate(mutations.deleteDeadline(d.id))}>×</Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <AddDeadlineDialog open={deadlineOpen} onOpenChange={setDeadlineOpen} />
    </div>
  );
}

function AddDeadlineDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { mutate } = useSg();
  const [f, setF] = useState({ title: "", date: "", kind: "AG", sub: "" });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const valid = f.title.trim() && f.date;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajouter une échéance</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Intitulé *</Label><Input value={f.title} onChange={(e) => set("title")(e.target.value)} placeholder="Renouvellement assurance RC" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Date *</Label><Input type="date" value={f.date} onChange={(e) => set("date")(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <NativeSelect className="w-full" value={f.kind} onChange={(e) => set("kind")(e.target.value)}>
                {["AG", "Assurance", "Compta", "Mandat", "Préfecture", "Autre"].map((k) => <NativeSelectOption key={k} value={k}>{k}</NativeSelectOption>)}
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Détail</Label><Input value={f.sub} onChange={(e) => set("sub")(e.target.value)} placeholder="Allianz · contrat FR-208441" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button disabled={!valid} onClick={() => { mutate(mutations.addDeadline(f.title, f.date, f.kind, f.sub)); toast.success("Échéance ajoutée"); onOpenChange(false); }}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
