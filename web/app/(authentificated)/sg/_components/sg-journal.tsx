"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import { toast } from "sonner";

import { uploadSgFileToDrive } from "../_lib/sg-api";
import { useSg } from "../_lib/sg-store";
import { buildJournalCsv, downloadBlob } from "../_lib/sg-utils";
import { SgAvatar } from "./sg-bits";

export function SgJournal() {
  const { data } = useSg();
  const [q, setQ] = useState("");
  const [who, setWho] = useState("all");

  const authors = ["all", ...Array.from(new Set(data.activity.map((a) => a.who).filter((w) => data.members.some((m) => m.id === w))))];

  const list = useMemo(
    () =>
      data.activity.filter((a) => {
        if (who !== "all" && a.who !== who) return false;
        if (q.trim()) {
          const m = data.members.find((x) => x.id === a.who);
          const hay = `${a.action} ${a.target} ${a.ctx} ${m ? `${m.first} ${m.last}` : ""}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [data, q, who],
  );

  const exportJournal = () => {
    const header = ["Quand", "Auteur", "Action", "Cible", "Contexte"];
    const rows = data.activity.map((a) => {
      const m = data.members.find((x) => x.id === a.who);
      return [a.when, m ? `${m.first} ${m.last}` : a.who, a.action, a.target, a.ctx];
    });
    const csv = "﻿" + [header, ...rows].map((r) => r.map((c) => (/[";\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c)).join(";")).join("\r\n");
    downloadBlob("journal-audit-jeece-sg.csv", csv, "text/csv;charset=utf-8");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{data.activity.length} entrées · traçabilité complète</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportJournal}>Exporter le journal</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const up = await uploadSgFileToDrive("journal-jeece-sg.csv", buildJournalCsv(data));
              up ? toast.success("Journal exporté vers Drive") : toast.error("Export Drive impossible (Drive lié ?).");
            }}
          >
            Exporter vers Drive
          </Button>
        </div>
      </div>

      <Card className="flex flex-wrap items-center gap-2 p-3">
        <Input className="h-9 max-w-xs flex-1" placeholder="Rechercher dans le journal…" value={q} onChange={(e) => setQ(e.target.value)} />
        <NativeSelect value={who} onChange={(e) => setWho(e.target.value)}>
          {authors.map((w) => {
            const m = data.members.find((x) => x.id === w);
            return <NativeSelectOption key={w} value={w}>{w === "all" ? "Tous les auteurs" : m ? `${m.first} ${m.last}` : w}</NativeSelectOption>;
          })}
        </NativeSelect>
        <div className="flex-1" />
        <Badge variant="outline">{list.length} / {data.activity.length}</Badge>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="divide-y divide-border">
          {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Aucune entrée.</p>}
          {list.map((a, i) => {
            const m = data.members.find((x) => x.id === a.who);
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                {m && <SgAvatar member={m} size={28} />}
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{m ? `${m.first} ${m.last}` : a.who}</span>{" "}
                  <span className="text-muted-foreground">{a.action}</span> <span className="font-medium">{a.target}</span>
                  <div className="text-xs text-muted-foreground">{a.ctx}</div>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">{a.when}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
