"use client";

import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Member, SpRow } from "./crm-sprint-detail-types";

export function CrmSprintDetailProspectsManagerPanel(props: {
  members: Member[];
  prospects: SpRow[];
  importAssigneeId: string;
  setImportAssigneeId: (v: string) => void;
  importBusy: boolean;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedBulk: Set<string>;
  setSelectedBulk: (s: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  bulkAssignTo: string;
  setBulkAssignTo: (v: string) => void;
  bulkBusy: boolean;
  randomBusy: boolean;
  onRunBulkAssign: (userId: string | null, ids: string[]) => void;
  onRandomAssign: (scope: "unassigned" | "all") => void;
  onOpenPick: () => void;
}) {
  const {
    members,
    prospects,
    importAssigneeId,
    setImportAssigneeId,
    importBusy,
    onImportFile,
    selectedBulk,
    setSelectedBulk,
    bulkAssignTo,
    setBulkAssignTo,
    bulkBusy,
    randomBusy,
    onRunBulkAssign,
    onRandomAssign,
    onOpenPick,
  } = props;

  return (
    <Card className="border-brand/15">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border/50 py-3">
        <PretextBlock as="h3" metric={PRETEXT.smMedium} text="Gestion des prospects" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onOpenPick}>
            Ajouter depuis la base
          </Button>
          <Button type="button" variant="outline" size="sm" asChild disabled={importBusy}>
            <label className="cursor-pointer">
              {importBusy ? "Import…" : "Importer fichier"}
              <input
                type="file"
                accept=".csv,.tsv,.xlsx,.xls"
                className="sr-only"
                onChange={(e) => void onImportFile(e)}
                disabled={importBusy}
              />
            </label>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        <div className="flex flex-wrap items-end gap-3 border-b border-brand/25 bg-brand/5 px-4 py-3">
          <div className="grid max-w-xs gap-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Assignation à l’import fichier
            </Label>
            <Select
              value={importAssigneeId || "__"}
              onValueChange={(v) => setImportAssigneeId(v === "__" ? "" : v)}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Non assigné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__">Non assigné</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div
            role="paragraph"
            className="text-muted-foreground max-w-md text-xs whitespace-normal break-words [overflow-wrap:anywhere]"
          >
            Les lignes importées seront rattachées au sprint avec ce membre comme assigné par
            défaut.
          </div>
        </div>
        {prospects.length > 0 ? (
          <div className="flex flex-wrap items-end gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
            <span className="text-muted-foreground self-center text-sm">
              {selectedBulk.size} sélectionné(s)
            </span>
            <div className="grid gap-1">
              <Label className="text-xs">Action groupée</Label>
              <Select
                value={bulkAssignTo || "__"}
                onValueChange={(v) => setBulkAssignTo(v === "__" ? "" : v)}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__">—</SelectItem>
                  <SelectItem value="__unassign">Désassigner</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={
                bulkBusy ||
                randomBusy ||
                selectedBulk.size === 0 ||
                !bulkAssignTo ||
                bulkAssignTo === "__"
              }
              onClick={() => {
                const uid = bulkAssignTo === "__unassign" ? null : bulkAssignTo;
                void onRunBulkAssign(uid, [...selectedBulk]);
              }}
            >
              Appliquer à la sélection
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                bulkBusy ||
                randomBusy ||
                !bulkAssignTo ||
                bulkAssignTo === "__" ||
                bulkAssignTo === "__unassign"
              }
              onClick={() => {
                const ids = prospects.filter((p) => !p.assignedUserId).map((p) => p.prospectId);
                void onRunBulkAssign(bulkAssignTo, ids);
              }}
            >
              Assigner tous les non assignés
            </Button>
            <div className="hidden h-6 w-px shrink-0 bg-border sm:block" aria-hidden />
            <span className="text-muted-foreground w-full text-xs font-medium uppercase tracking-wide sm:w-auto">
              Aléatoire (membres du sprint)
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={randomBusy || bulkBusy || members.length === 0}
              onClick={() => void onRandomAssign("unassigned")}
            >
              {randomBusy ? "…" : "Répartir au hasard (non assignés)"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={randomBusy || bulkBusy || members.length === 0}
              onClick={() => {
                if (
                  !confirm(
                    "Réassigner tous les prospects du sprint au hasard entre les membres ? Les assignations actuelles seront remplacées.",
                  )
                ) {
                  return;
                }
                void onRandomAssign("all");
              }}
            >
              Répartir au hasard (tous)
            </Button>
          </div>
        ) : (
          <div className="px-4 py-3 text-muted-foreground text-sm" role="paragraph">
            Aucun prospect dans ce sprint — importez ou ajoutez depuis la base.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
