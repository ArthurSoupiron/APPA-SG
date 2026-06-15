"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { groupPermColorAt } from "@/app/(authentificated)/account/admin/workspace/_lib/group-permissions-colors";
import {
  draftFromRow,
  groupDisplayLabel,
  matchesGroupSearch,
  setPermissionsForGroups,
  togglePermissionAcrossGroups,
  type DraftByGroupId,
  type GwGroupPermRow,
} from "@/app/(authentificated)/account/admin/workspace/_lib/group-permissions-state";
import { GroupPermissionsEditor } from "@/app/(authentificated)/account/admin/workspace/_components/group-permissions-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { PermissionAdminSection } from "@/lib/ubac-catalog-types";
import { cn } from "@/lib/utils";

type GroupPermissionsPanelProps = {
  groupPermRows: GwGroupPermRow[];
  permCatalog: string[];
  permSections: PermissionAdminSection[];
  onSaved: () => Promise<void>;
};

export function GroupPermissionsPanel({
  groupPermRows,
  permCatalog,
  permSections,
  onSaved,
}: GroupPermissionsPanelProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [draftByGroupId, setDraftByGroupId] = useState<DraftByGroupId>({});
  const [groupSearch, setGroupSearch] = useState("");
  const [groupPermSaveBusy, setGroupPermSaveBusy] = useState(false);

  const filteredGroups = useMemo(
    () => groupPermRows.filter((g) => matchesGroupSearch(g, groupSearch)),
    [groupPermRows, groupSearch],
  );

  const selectedGroups = useMemo(
    () =>
      selectedGroupIds.map((id, index) => {
        const row = groupPermRows.find((g) => g.id === id);
        return {
          id,
          label: row ? groupDisplayLabel(row) : id,
          colorIndex: index,
        };
      }),
    [selectedGroupIds, groupPermRows],
  );

  useEffect(() => {
    if (groupPermRows.length === 0) {
      setSelectedGroupIds([]);
      return;
    }
    setSelectedGroupIds((prev) => {
      const valid = prev.filter((id) => groupPermRows.some((g) => g.id === id));
      if (valid.length > 0) return valid;
      return [groupPermRows[0]!.id];
    });
  }, [groupPermRows]);

  useEffect(() => {
    const next: DraftByGroupId = {};
    for (const row of groupPermRows) {
      next[row.id] = draftFromRow(row);
    }
    setDraftByGroupId(next);
  }, [groupPermRows]);

  const toggleGroupSelection = useCallback((groupId: string, checked: boolean) => {
    setSelectedGroupIds((prev) => {
      if (checked) return prev.includes(groupId) ? prev : [...prev, groupId];
      const next = prev.filter((id) => id !== groupId);
      return next.length > 0 ? next : prev;
    });
  }, []);

  const selectAllFiltered = () => {
    setSelectedGroupIds((prev) => {
      const merged = new Set(prev);
      for (const g of filteredGroups) merged.add(g.id);
      return [...merged];
    });
  };

  const selectNone = () => {
    if (groupPermRows[0]) setSelectedGroupIds([groupPermRows[0].id]);
  };

  const toggleDraftPerm = (permission: string) => {
    setDraftByGroupId((prev) =>
      togglePermissionAcrossGroups(prev, selectedGroupIds, permission),
    );
  };

  const saveGroupPermissions = async () => {
    if (selectedGroupIds.length === 0) {
      toast.error("Choisissez au moins un groupe.");
      return;
    }
    setGroupPermSaveBusy(true);
    try {
      let ok = 0;
      for (const groupId of selectedGroupIds) {
        const perms = [...(draftByGroupId[groupId] ?? [])].sort();
        const res = await fetch(
          `/api/app/admin/gw/group-permissions/${encodeURIComponent(groupId)}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ permissions: perms }),
          },
        );
        if (res.ok) ok += 1;
      }
      if (ok === 0) {
        toast.error("Enregistrement impossible.");
        return;
      }
      if (ok < selectedGroupIds.length) {
        toast.warning(`Enregistré pour ${ok}/${selectedGroupIds.length} groupes.`);
      } else {
        toast.success(
          selectedGroupIds.length > 1
            ? `Permissions enregistrées pour ${ok} groupes.`
            : "Permissions du groupe enregistrées.",
        );
      }
      await onSaved();
    } finally {
      setGroupPermSaveBusy(false);
    }
  };

  const primaryGroup = groupPermRows.find((g) => g.id === selectedGroupIds[0]);

  return (
    <div className="grid min-h-[min(480px,70vh)] gap-4 lg:grid-cols-[minmax(240px,300px)_1fr]">
      <div className="flex min-h-0 flex-col gap-2 rounded-md border p-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            placeholder="Rechercher un groupe…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" size="sm" variant="outline" onClick={selectAllFiltered}>
            Tout (filtré)
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={selectNone}>
            Un seul
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          {selectedGroupIds.length} sélectionné{selectedGroupIds.length > 1 ? "s" : ""}
          {groupSearch.trim() ? ` · ${filteredGroups.length} affiché(s)` : ""}
        </p>
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-0.5 p-0.5">
            {filteredGroups.length === 0 ? (
              <p className="px-2 py-3 text-muted-foreground text-sm">Aucun groupe trouvé.</p>
            ) : (
              filteredGroups.map((g) => {
                const selected = selectedGroupIds.includes(g.id);
                const colorIndex = selectedGroupIds.indexOf(g.id);
                const color = selected && colorIndex >= 0 ? groupPermColorAt(colorIndex) : null;
                const rowId = `gw-group-${g.id}`;
                return (
                  <div
                    key={g.id}
                    className={cn(
                      "flex items-start gap-2 rounded-md border border-transparent px-2 py-2 transition-colors hover:bg-muted/60",
                      selected && color?.bg,
                      selected && selectedGroupIds.length > 1 && color?.border,
                    )}
                  >
                    <Checkbox
                      id={rowId}
                      checked={selected}
                      onCheckedChange={(v) => toggleGroupSelection(g.id, v === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor={rowId} className="min-w-0 flex-1 cursor-pointer font-normal">
                      <span className="flex items-start gap-1.5">
                        {selected && selectedGroupIds.length > 1 && color ? (
                          <span
                            className={cn("mt-1.5 size-2 shrink-0 rounded-full", color.dot)}
                            aria-hidden
                          />
                        ) : null}
                        <span className="block break-words text-sm [overflow-wrap:anywhere]">
                          {groupDisplayLabel(g)}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {g.permissions.length} permission{g.permissions.length > 1 ? "s" : ""}
                      </span>
                    </Label>
                  </div>
                );
              })
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>

      <div className="flex min-w-0 flex-col gap-3 rounded-md border p-3 lg:min-h-[min(480px,70vh)]">
        {primaryGroup ? (
          <>
            <div role="paragraph" className="text-muted-foreground text-xs">
              {selectedGroupIds.length > 1
                ? `${selectedGroupIds.length} groupes en édition groupée`
                : `Sync : ${new Date(primaryGroup.syncedAt).toLocaleString("fr-FR")} · ${primaryGroup.permissions.length} en base`}
            </div>
            <GroupPermissionsEditor
              sections={permSections}
              permCatalog={permCatalog}
              selectedGroupIds={selectedGroupIds}
              selectedGroups={selectedGroups}
              groupPermRows={groupPermRows}
              draftByGroupId={draftByGroupId}
              groupPermSaveBusy={groupPermSaveBusy}
              onTogglePerm={toggleDraftPerm}
              onSelectAll={() =>
                setDraftByGroupId((prev) =>
                  setPermissionsForGroups(prev, selectedGroupIds, permCatalog, "replace"),
                )
              }
              onSelectNone={() =>
                setDraftByGroupId((prev) =>
                  setPermissionsForGroups(prev, selectedGroupIds, [], "replace"),
                )
              }
              onSelectSection={(permissionIds) =>
                setDraftByGroupId((prev) =>
                  setPermissionsForGroups(prev, selectedGroupIds, permissionIds, "add"),
                )
              }
              onSave={() => void saveGroupPermissions()}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
