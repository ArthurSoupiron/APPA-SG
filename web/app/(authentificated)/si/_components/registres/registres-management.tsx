"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createRegistre,
  deleteRegistre,
  updateRegistre,
} from "../../_lib/si-registres-api";
import type { RegistreDto, RegistreType, TraitementDataDto } from "../../_lib/si-registres-types";
import {
  formatFacturationDate,
  formatRegistreCreator,
  RegistreExternalLink,
} from "./registres-display-helpers";
import { RegistreFormDialog } from "./registre-form-dialog";
import {
  getRegistreSortValue,
  REGISTRE_COLUMN_LABELS,
  registreColumnsForType,
  type RegistreSortColumn,
} from "./registres-sort-values";
import { SortableTableHead, useSortedRows, useTableSort } from "./registres-table-sort";
import { SheetAccessView } from "./sheet-access-view";

type Props = {
  registres: RegistreDto[];
  traitements: TraitementDataDto[];
  defaultFilterType: RegistreType;
  canEdit: boolean;
  canDelete: boolean;
  onRegistresChange: (registres: RegistreDto[]) => void;
  onReload: () => Promise<void>;
};

export function RegistresManagement({
  registres,
  traitements,
  defaultFilterType,
  canEdit,
  canDelete,
  onRegistresChange,
  onReload,
}: Props) {
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RegistreDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegistreDto | null>(null);
  const [sheetViewUrl, setSheetViewUrl] = useState<string | null>(null);
  const { sort, toggleSort, resetSort } = useTableSort<RegistreSortColumn>("anneeCivile");

  useEffect(() => {
    resetSort("anneeCivile");
  }, [defaultFilterType, resetSort]);
  const getSortValue = useCallback(
    (row: RegistreDto, column: RegistreSortColumn) => getRegistreSortValue(row, column),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return registres.filter((r) => {
      if (r.type !== defaultFilterType) return false;
      if (!q) return true;
      const columns = registreColumnsForType(defaultFilterType);
      return columns.some((col) => {
        const value = getRegistreSortValue(r, col);
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(q);
      });
    });
  }, [registres, defaultFilterType, query]);

  const displayed = useSortedRows(filtered, sort, getSortValue);
  const sortColumns = registreColumnsForType(defaultFilterType);

  const title =
    defaultFilterType === "rgpd"
      ? "Registre RGPD"
      : defaultFilterType === "licences"
        ? "Registre licences"
        : "Registre bases de données";

  const upsertLocal = (next: RegistreDto) => {
    const without = registres.filter((r) => r.id !== next.id);
    onRegistresChange([...without, next]);
  };

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (editing) {
      const updated = await updateRegistre(defaultFilterType, editing.id, payload);
      if (updated) upsertLocal(updated);
    } else {
      const created = await createRegistre(defaultFilterType, payload);
      if (created) upsertLocal(created);
    }
    await onReload();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteRegistre(deleteTarget.type, deleteTarget.id);
    if (ok) {
      onRegistresChange(registres.filter((r) => r.id !== deleteTarget.id));
      await onReload();
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {canEdit && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1 size-4" />
            Ajouter
          </Button>
        )}
      </div>

      <Input
        placeholder="Rechercher…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {sortColumns.map((column) => (
                <SortableTableHead
                  key={column}
                  column={column}
                  label={REGISTRE_COLUMN_LABELS[column]}
                  sort={sort}
                  onSort={toggleSort}
                />
              ))}
              {(canEdit || canDelete) && <TableHead className="w-[120px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 && (
              <TableRow>
                <TableCell colSpan={99} className="text-muted-foreground">
                  Aucune entrée.
                </TableCell>
              </TableRow>
            )}
            {displayed.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.anneeCivile}</TableCell>
                <TableCell className="whitespace-normal break-words">{r.nom}</TableCell>
                {defaultFilterType === "licences" && r.type === "licences" && (
                  <TableCell className="whitespace-normal break-words">
                    {formatFacturationDate(r.dateFacturation)}
                  </TableCell>
                )}
                {defaultFilterType === "licences" && r.type === "licences" && (
                  <TableCell>
                    <Badge variant={r.utilisationCommerciale ? "default" : "secondary"}>
                      {r.utilisationCommerciale ? "Oui" : "Non"}
                    </Badge>
                  </TableCell>
                )}
                {defaultFilterType === "licences" && r.type === "licences" && (
                  <TableCell className="min-w-[12rem] whitespace-normal break-words">
                    <RegistreExternalLink
                      url={r.licenceCommercialeUrl}
                      label="Licence commerciale"
                    />
                  </TableCell>
                )}
                {defaultFilterType === "bdd" && r.type === "bdd" && (
                  <TableCell className="whitespace-normal break-words">
                    {r.traitementDataNom ?? "—"}
                  </TableCell>
                )}
                {defaultFilterType === "bdd" && r.type === "bdd" && (
                  <TableCell className="min-w-[12rem] whitespace-normal break-words">
                    {r.sheetExcelUrl ? (
                      <div className="space-y-1">
                        <RegistreExternalLink url={r.sheetExcelUrl} label="Google Sheet" />
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-sm"
                          onClick={() => setSheetViewUrl(r.sheetExcelUrl)}
                        >
                          Qui a accès
                        </Button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                )}
                <TableCell className="whitespace-normal break-words">
                  <span>{formatRegistreCreator(r.user)}</span>
                  {r.user.email && r.user.name && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{r.user.email}</span>
                  )}
                </TableCell>
                <TableCell className="min-w-[10rem] whitespace-normal break-words">
                  <RegistreExternalLink url={r.driveFolderUrl} label="Dossier Drive" />
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell>
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(r);
                            setDialogOpen(true);
                          }}
                          aria-label="Modifier"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(r)}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RegistreFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={defaultFilterType}
        editing={editing}
        traitements={traitements}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-normal break-words">
              {deleteTarget?.nom} — cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {sheetViewUrl && (
        <div className="space-y-2 rounded-md border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium">Accès Google Sheet</h4>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSheetViewUrl(null)}>
              Fermer
            </Button>
          </div>
          <SheetAccessView sheetUrl={sheetViewUrl} />
        </div>
      )}
    </div>
  );
}
