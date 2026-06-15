"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { groupPermColorAt } from "@/app/(authentificated)/account/admin/workspace/_lib/group-permissions-colors";
import {
  groupDisplayLabel,
  permissionAcrossGroups,
  type DraftByGroupId,
  type GwGroupPermRow,
} from "@/app/(authentificated)/account/admin/workspace/_lib/group-permissions-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { PermissionAdminSection } from "@/lib/ubac-catalog-types";
import { cn } from "@/lib/utils";

type SelectedGroupMeta = {
  id: string;
  label: string;
  colorIndex: number;
};

type GroupPermissionsEditorProps = {
  sections: PermissionAdminSection[];
  permCatalog: string[];
  selectedGroupIds: string[];
  selectedGroups: SelectedGroupMeta[];
  groupPermRows: GwGroupPermRow[];
  draftByGroupId: DraftByGroupId;
  groupPermSaveBusy: boolean;
  onTogglePerm: (permission: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectSection: (permissionIds: string[]) => void;
  onSave: () => void;
};

function matchesPermSearch(entry: { actionLabel: string; id: string; fullLabel: string }, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return (
    entry.actionLabel.toLowerCase().includes(query) ||
    entry.id.toLowerCase().includes(query) ||
    entry.fullLabel.toLowerCase().includes(query)
  );
}

export function GroupPermissionsEditor({
  sections,
  permCatalog,
  selectedGroupIds,
  selectedGroups,
  groupPermRows,
  draftByGroupId,
  groupPermSaveBusy,
  onTogglePerm,
  onSelectAll,
  onSelectNone,
  onSelectSection,
  onSave,
}: GroupPermissionsEditorProps) {
  const [permSearch, setPermSearch] = useState("");
  const multi = selectedGroupIds.length > 1;

  const colorByGroupId = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of selectedGroups) map.set(g.id, g.colorIndex);
    return map;
  }, [selectedGroups]);

  const filteredSections = useMemo(() => {
    const q = permSearch.trim();
    if (!q) return sections;
    return sections
      .map((section) => ({
        ...section,
        subGroups: section.subGroups
          .map((sg) => ({
            ...sg,
            entries: sg.entries.filter((e) => matchesPermSearch(e, q)),
          }))
          .filter((sg) => sg.entries.length > 0),
      }))
      .filter((s) => s.subGroups.length > 0);
  }, [sections, permSearch]);

  const draftCount = useMemo(() => {
    if (selectedGroupIds.length === 0) return 0;
    if (selectedGroupIds.length === 1) {
      return draftByGroupId[selectedGroupIds[0]!]?.size ?? 0;
    }
    const counts = selectedGroupIds.map((id) => draftByGroupId[id]?.size ?? 0);
    return Math.min(...counts);
  }, [draftByGroupId, selectedGroupIds]);

  return (
    <>
      {multi ? (
        <div className="space-y-2 rounded-md border border-dashed p-3">
          <div role="paragraph" className="font-medium text-xs">
            Légende — {selectedGroupIds.length} groupes sélectionnés
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedGroups.map((g) => {
              const color = groupPermColorAt(g.colorIndex);
              return (
                <span
                  key={g.id}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
                    color.border,
                    color.bg,
                    color.text,
                  )}
                >
                  <span className={cn("size-2 shrink-0 rounded-full", color.dot)} aria-hidden />
                  <span className="break-words [overflow-wrap:anywhere]">{g.label}</span>
                </span>
              );
            })}
          </div>
          <p className="text-muted-foreground text-xs">
            Case cochée = tous les groupes · tiret = seulement certains (pastilles colorées) · vide =
            aucun. Un clic applique la permission à tous les groupes sélectionnés.
          </p>
        </div>
      ) : null}

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={permSearch}
          onChange={(e) => setPermSearch(e.target.value)}
          placeholder="Rechercher une permission…"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onSelectAll}>
          Toutes les permissions
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onSelectNone}>
          Aucune
        </Button>
        {sections.map((section) => {
          const sectionPermIds = section.subGroups.flatMap((sg) => sg.entries.map((e) => e.id));
          return (
            <Button
              key={section.groupKey}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onSelectSection(sectionPermIds)}
            >
              Tout · {section.groupLabel}
            </Button>
          );
        })}
      </div>

      <ScrollArea className="min-h-0 flex-1 rounded-md border p-3">
        <div className="space-y-8 pr-3">
          {filteredSections.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune permission ne correspond à la recherche.</p>
          ) : (
            filteredSections.map((section) => (
              <section key={section.groupKey} className="space-y-4">
                <div role="paragraph" className="font-semibold text-sm">
                  {section.groupLabel}
                </div>
                {section.subGroups.map((subGroup) => (
                  <div
                    key={`${section.groupKey}-${subGroup.subGroupKey ?? "__root"}`}
                    className="space-y-2 border-l-2 border-muted pl-3"
                  >
                    {subGroup.subGroupLabel ? (
                      <div role="paragraph" className="font-medium text-muted-foreground text-xs">
                        {subGroup.subGroupLabel}
                      </div>
                    ) : null}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {subGroup.entries.map((entry) => {
                        const permId = `perm-${entry.id}-${selectedGroupIds.join("-")}`;
                        const state = permissionAcrossGroups(
                          draftByGroupId,
                          selectedGroupIds,
                          entry.id,
                        );
                        const checked =
                          state.kind === "all"
                            ? true
                            : state.kind === "partial"
                              ? "indeterminate"
                              : false;

                        const rowColors =
                          state.kind === "partial"
                            ? state.groupIds.map((gid) => groupPermColorAt(colorByGroupId.get(gid) ?? 0))
                            : state.kind === "all" && multi
                              ? selectedGroups.map((g) => groupPermColorAt(g.colorIndex))
                              : [];

                        return (
                          <div
                            key={entry.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-2 rounded-md border border-transparent p-1.5 text-sm transition-colors hover:bg-muted/50",
                              rowColors.length === 1 && multi && rowColors[0]!.bg,
                              state.kind === "partial" && multi && "border-dashed",
                            )}
                          >
                            <Checkbox
                              id={permId}
                              checked={checked}
                              onCheckedChange={() => onTogglePerm(entry.id)}
                              className="mt-0.5"
                            />
                            <Label htmlFor={permId} className="min-w-0 flex-1 space-y-1 font-normal">
                              <span className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm">{entry.actionLabel}</span>
                                {multi && rowColors.length > 0 ? (
                                  <span className="inline-flex flex-wrap gap-1">
                                    {state.kind === "partial"
                                      ? state.groupIds.map((gid) => {
                                          const ci = colorByGroupId.get(gid) ?? 0;
                                          const c = groupPermColorAt(ci);
                                          return (
                                            <span
                                              key={gid}
                                              title={groupDisplayLabel(
                                                groupPermRows.find((r) => r.id === gid) ?? {
                                                  email: gid,
                                                  name: null,
                                                },
                                              )}
                                              className={cn("size-2 rounded-full", c.dot)}
                                            />
                                          );
                                        })
                                      : state.kind === "all"
                                        ? selectedGroups.map((g) => {
                                            const c = groupPermColorAt(g.colorIndex);
                                            return (
                                              <span
                                                key={g.id}
                                                title={g.label}
                                                className={cn("size-2 rounded-full", c.dot)}
                                              />
                                            );
                                          })
                                        : null}
                                  </span>
                                ) : null}
                              </span>
                              <span className="block break-words font-mono text-muted-foreground text-xs [overflow-wrap:anywhere]">
                                {entry.id}
                              </span>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </section>
            ))
          )}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onSave}
          disabled={groupPermSaveBusy || selectedGroupIds.length === 0}
          className="w-fit gap-2"
        >
          {groupPermSaveBusy ? <Spinner className="size-4" /> : null}
          Enregistrer
          {selectedGroupIds.length > 1 ? ` (${selectedGroupIds.length} groupes)` : ""}
        </Button>
        <span className="text-muted-foreground text-xs">
          {multi
            ? `${draftCount} communes min. / ${permCatalog.length} par groupe`
            : `${draftCount} / ${permCatalog.length} sélectionnées`}
        </span>
      </div>
    </>
  );
}
