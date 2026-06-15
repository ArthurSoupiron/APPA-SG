"use client";

import {
  CRM_PROSPECT_STATUSES,
  CRM_PROSPECT_STATUT_LABELS,
  CRM_STATUT_BADGE_CLASS,
  type CrmProspectStatut,
} from "@myster/_lib/crm-statuts";
import type { Dispatch, SetStateAction } from "react";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { Prospect } from "./crm-contacts-types";

export function CrmContactsListCard(props: {
  hasPermission: (p: string) => boolean;
  loading: boolean;
  prospects: Prospect[];
  total: number;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  q: string;
  setQ: (v: string) => void;
  statutFilter: string;
  setStatutFilter: (v: string) => void;
  importBusy: boolean;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCreate: () => void;
  onOpenSheet: (p: Prospect) => void;
  onOpenEdit: (p: Prospect) => void;
  onRemove: (p: Prospect) => void;
  onReload: () => void;
  exportUrl: (format: "csv" | "xlsx") => string;
}) {
  const {
    hasPermission,
    loading,
    prospects,
    total,
    page,
    setPage,
    q,
    setQ,
    statutFilter,
    setStatutFilter,
    importBusy,
    onImportFile,
    onOpenCreate,
    onOpenSheet,
    onOpenEdit,
    onRemove,
    onReload,
    exportUrl,
  } = props;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 border-b sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md">
          <Label htmlFor="crm-q">
            <PretextBlock
              as="span"
              metric={PRETEXT.xs}
              text="Recherche"
              className="text-muted-foreground uppercase tracking-wide"
            />
          </Label>
          <Input
            id="crm-q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(() => 1);
            }}
            placeholder="Nom, e-mail, entreprise…"
          />
        </div>
        <div className="flex flex-col gap-2">
          <PretextBlock
            as="span"
            metric={PRETEXT.xs}
            text="Statut"
            className="text-muted-foreground uppercase tracking-wide"
          />
          <Select
            value={statutFilter || "__all"}
            onValueChange={(v) => {
              setStatutFilter(v === "__all" ? "" : v);
              setPage(() => 1);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Tous</SelectItem>
              {CRM_PROSPECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {CRM_PROSPECT_STATUT_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission("crm.write") ? (
            <>
              <Button type="button" onClick={onOpenCreate}>
                Nouveau prospect
              </Button>
              <Button type="button" variant="outline" asChild disabled={importBusy}>
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
            </>
          ) : null}
          {hasPermission("crm.read") ? (
            <>
              <Button type="button" variant="outline" asChild>
                <a href={exportUrl("csv")} download>
                  Export CSV
                </a>
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href={exportUrl("xlsx")} download>
                  Export Excel
                </a>
              </Button>
            </>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => void onReload()}>
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-8" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucun prospect.
                    </TableCell>
                  </TableRow>
                ) : (
                  prospects.map((p) => (
                    <TableRow
                      key={p.id}
                      className={hasPermission("crm.read") ? "cursor-pointer" : undefined}
                      onClick={() => {
                        if (hasPermission("crm.read")) onOpenSheet(p);
                      }}
                    >
                      <TableCell className="font-medium">
                        {p.prenom ? `${p.prenom} ` : ""}
                        {p.nom}
                      </TableCell>
                      <TableCell>{p.email ?? "—"}</TableCell>
                      <TableCell>{p.entreprise ?? "—"}</TableCell>
                      <TableCell>{p.secteur ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "w-fit font-normal",
                            CRM_STATUT_BADGE_CLASS[p.statut] ?? "border-border",
                          )}
                        >
                          {CRM_PROSPECT_STATUT_LABELS[p.statut as CrmProspectStatut] ?? p.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-2">
                          {hasPermission("crm.write") ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEdit(p);
                              }}
                            >
                              Modifier
                            </Button>
                          ) : null}
                          {hasPermission("crm.delete") ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                void onRemove(p);
                              }}
                            >
                              Supprimer
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <PretextBlock
            as="p"
            metric={PRETEXT.sm}
            text={`${total} prospect(s) — page ${page}`}
            className="text-muted-foreground"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page * 50 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
