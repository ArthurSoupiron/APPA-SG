"use client";

import { useCallback, useMemo, useState } from "react";
import { FileText, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createTraitement,
  deleteTraitement,
  scanTraitementPreuves,
  updateTraitement,
} from "../../_lib/si-registres-api";
import type { TraitementDataDto } from "../../_lib/si-registres-types";
import { formatRegistreCreator, RegistreExternalLink } from "./registres-display-helpers";
import {
  getTraitementSortValue,
  TRAITEMENT_COLUMN_LABELS,
  type TraitementSortColumn,
} from "./registres-sort-values";
import { SortableTableHead, useSortedRows, useTableSort } from "./registres-table-sort";
import { TraitementFicheDialog } from "./traitement-fiche-dialog";

const TRAITEMENT_SORT_COLUMNS: TraitementSortColumn[] = [
  "reference",
  "nomTraitement",
  "creator",
  "driveFolderUrl",
  "fichePdfUrl",
  "preuveConsentementUrl",
  "preuveMentionsUrl",
];

type Props = {
  traitements: TraitementDataDto[];
  canEdit: boolean;
  canDelete: boolean;
  onTraitementsChange: (traitements: TraitementDataDto[]) => void;
  templateUrl: string;
};

export function TraitementDataView({
  traitements,
  canEdit,
  canDelete,
  onTraitementsChange,
  templateUrl,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TraitementDataDto | null>(null);
  const [nomTraitement, setNomTraitement] = useState("");
  const [descriptionFinalite, setDescriptionFinalite] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TraitementDataDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [ficheTarget, setFicheTarget] = useState<TraitementDataDto | null>(null);
  const [query, setQuery] = useState("");
  const { sort, toggleSort } = useTableSort<TraitementSortColumn>("reference");
  const getSortValue = useCallback(
    (row: TraitementDataDto, column: TraitementSortColumn) => getTraitementSortValue(row, column),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return traitements;
    return traitements.filter((t) =>
      TRAITEMENT_SORT_COLUMNS.some((col) => {
        const value = getTraitementSortValue(t, col);
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(q);
      }),
    );
  }, [traitements, query]);

  const displayed = useSortedRows(filtered, sort, getSortValue);

  const openCreate = () => {
    setEditing(null);
    setNomTraitement("");
    setDescriptionFinalite("");
    setDialogOpen(true);
  };

  const openEdit = (t: TraitementDataDto) => {
    setEditing(t);
    setNomTraitement(t.nomTraitement);
    setDescriptionFinalite(t.descriptionFinalite ?? "");
    setDialogOpen(true);
  };

  const upsert = (next: TraitementDataDto) => {
    onTraitementsChange([...traitements.filter((t) => t.id !== next.id), next]);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      const updated = await updateTraitement(editing.id, {
        nomTraitement: nomTraitement.trim(),
        descriptionFinalite: descriptionFinalite.trim() || null,
      });
      if (updated) upsert(updated);
    } else {
      const created = await createTraitement({
        nomTraitement: nomTraitement.trim(),
        descriptionFinalite: descriptionFinalite.trim() || undefined,
      });
      if (created) upsert(created);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteTraitement(deleteTarget.id);
    if (ok) onTraitementsChange(traitements.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleScan = async (id: string) => {
    const updated = await scanTraitementPreuves(id);
    if (updated) upsert(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Traitements de données</h3>
        {canEdit && (
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            Nouvelle fiche
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
              {TRAITEMENT_SORT_COLUMNS.map((column) => (
                <SortableTableHead
                  key={column}
                  column={column}
                  label={TRAITEMENT_COLUMN_LABELS[column]}
                  sort={sort}
                  onSort={toggleSort}
                />
              ))}
              {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 && (
              <TableRow>
                <TableCell colSpan={99} className="text-muted-foreground">
                  Aucun traitement enregistré.
                </TableCell>
              </TableRow>
            )}
            {displayed.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.reference}</TableCell>
                <TableCell className="whitespace-normal break-words">{t.nomTraitement}</TableCell>
                <TableCell className="whitespace-normal break-words">
                  <span>{formatRegistreCreator(t.user)}</span>
                  {t.user.email && t.user.name && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{t.user.email}</span>
                  )}
                </TableCell>
                <TableCell className="min-w-[10rem] whitespace-normal break-words">
                  <RegistreExternalLink url={t.driveFolderUrl} label="Dossier Drive" />
                </TableCell>
                <TableCell className="min-w-[10rem] whitespace-normal break-words">
                  <RegistreExternalLink url={t.fichePdfUrl} label="Fiche PDF" />
                </TableCell>
                <TableCell className="min-w-[10rem] whitespace-normal break-words">
                  <RegistreExternalLink url={t.preuveConsentementUrl} label="Consentement" />
                </TableCell>
                <TableCell className="min-w-[10rem] whitespace-normal break-words">
                  <RegistreExternalLink url={t.preuveMentionsUrl} label="Mentions" />
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell>
                    <div className="flex gap-1">
                      {canEdit && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setFicheTarget(t)}
                            aria-label="Fiche et modèle KiwiX"
                          >
                            <FileText className="size-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(t)} aria-label="Modifier">
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleScan(t.id)}
                            aria-label="Scanner preuves Drive"
                          >
                            <RefreshCw className="size-4" />
                          </Button>
                        </>
                      )}
                      {canDelete && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteTarget(t)} aria-label="Supprimer">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la fiche" : "Nouvelle fiche de traitement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomTraitement">Nom du traitement</Label>
              <Input id="nomTraitement" value={nomTraitement} onChange={(e) => setNomTraitement(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Finalité / description</Label>
              <Textarea
                id="description"
                value={descriptionFinalite}
                onChange={(e) => setDescriptionFinalite(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={saving || !nomTraitement.trim()} onClick={() => void handleSave()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TraitementFicheDialog
        open={Boolean(ficheTarget)}
        onOpenChange={(open) => !open && setFicheTarget(null)}
        traitement={ficheTarget}
        templateUrl={templateUrl}
        onUpdated={(updated) => {
          upsert(updated);
          setFicheTarget(updated);
        }}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce traitement ?</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-normal break-words">
              {deleteTarget?.nomTraitement}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
