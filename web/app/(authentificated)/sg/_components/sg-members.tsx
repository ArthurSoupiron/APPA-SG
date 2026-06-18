"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useSgBase } from "../_lib/sg-base";
import { sendRelanceEmail, uploadSgFileToDrive } from "../_lib/sg-api";
import { dossierStats, mutations, useSg } from "../_lib/sg-store";
import { buildMembersCsv, exportMembersCSV } from "../_lib/sg-utils";
import { CompletenessBar, DocDots, IconCheck, IconClock, IconUsers, SgAvatar, StatCard, StatusBadge } from "./sg-bits";
import { ImportMembersDialog, MemberFormDialog } from "./sg-member-dialogs";

export function SgMembers() {
  const { data, mutate } = useSg();
  const base = useSgBase();
  const [q, setQ] = useState("");
  const [pole, setPole] = useState("all");
  const [status, setStatus] = useState("all");
  const [completeness, setCompleteness] = useState("all");
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [driveImportOpen, setDriveImportOpen] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const poles = ["all", ...Array.from(new Set(data.members.map((m) => m.pole)))];

  const list = useMemo(() => {
    return data.members
      .filter((m) => {
        if (pole !== "all" && m.pole !== pole) return false;
        if (status !== "all" && m.status !== status) return false;
        const s = dossierStats(data, m);
        if (completeness === "complete" && s.pct !== 100) return false;
        if (completeness === "incomplete" && s.pct === 100) return false;
        if (q.trim()) {
          const hay = `${m.first} ${m.last} ${m.email} ${m.role} ${m.pole}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => dossierStats(data, a).pct - dossierStats(data, b).pct);
  }, [data, q, pole, status, completeness]);

  const counts = {
    complete: data.members.filter((m) => dossierStats(data, m).pct === 100).length,
    incomplete: data.members.filter((m) => dossierStats(data, m).pct < 100).length,
  };

  const toggle = (id: string) =>
    setChecked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const allChecked = list.length > 0 && list.every((m) => checked.has(m.id));

  const bulkRelance = async () => {
    const targets = list.filter((m) => checked.has(m.id) && dossierStats(data, m).pct < 100 && m.status !== "alumni");
    if (!targets.length) {
      toast.info("Aucun dossier incomplet à relancer");
      return;
    }
    const subject = "[JEECE · SG] Dossier membre à compléter";
    const body = "Bonjour,\n\nMerci de compléter les pièces manquantes de ton dossier membre JEECE dès que possible.\n\nLe Secrétariat Général · JEECE";
    // Envoi automatique côté serveur (un mail par membre) ; repli mailto groupé si SMTP non configuré.
    const results = await Promise.all(targets.map((m) => sendRelanceEmail(m.email, subject, body)));
    const sent = results.filter((r) => r === "sent").length;
    if (sent === targets.length) {
      toast.success(`Relance envoyée à ${sent} membre(s)`);
      return;
    }
    const emails = targets.map((m) => m.email).join(",");
    window.location.href = `mailto:${encodeURIComponent(emails)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.info(sent ? `${sent} envoyé(s) — brouillon ouvert pour le reste` : "Envoi auto indisponible — brouillon ouvert");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {data.members.length} dossiers · {counts.complete} complets · {counts.incomplete} à régulariser
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportMembersCSV(data)}>Exporter</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const up = await uploadSgFileToDrive("membres-jeece-sg.csv", buildMembersCsv(data));
              up ? toast.success("Membres exportés vers Drive") : toast.error("Export Drive impossible (Drive lié ?).");
            }}
          >
            Exporter vers Drive
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>Importer</Button>
          <Button variant="outline" size="sm" onClick={() => setDriveImportOpen(true)}>Importer depuis Drive</Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>Nouveau membre</Button>
        </div>
      </div>

      {/* cartes de synthèse */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Membres" value={data.members.length} accent="blue" icon={<IconUsers />} />
        <StatCard label="Actifs" value={data.members.filter((m) => m.status === "active").length} accent="primary" icon={<IconCheck />} />
        <StatCard label="Postulants" value={data.members.filter((m) => m.status === "pending").length} accent="amber" icon={<IconClock />} />
        <StatCard label="Dossiers complets" value={counts.complete} accent="violet" icon={<IconCheck />} />
      </div>

      {/* filtres */}
      <Card className="flex flex-wrap items-center gap-2 p-3">
        <Input className="h-9 max-w-xs flex-1" placeholder="Rechercher un membre…" value={q} onChange={(e) => setQ(e.target.value)} />
        <NativeSelect value={pole} onChange={(e) => setPole(e.target.value)}>
          {poles.map((p) => <NativeSelectOption key={p} value={p}>{p === "all" ? "Tous les pôles" : p}</NativeSelectOption>)}
        </NativeSelect>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <NativeSelectOption value="all">Tous statuts</NativeSelectOption>
          <NativeSelectOption value="active">Actifs</NativeSelectOption>
          <NativeSelectOption value="pending">Postulants</NativeSelectOption>
          <NativeSelectOption value="alumni">Alumni</NativeSelectOption>
          <NativeSelectOption value="inactive">Inactifs</NativeSelectOption>
        </NativeSelect>
        <NativeSelect value={completeness} onChange={(e) => setCompleteness(e.target.value)}>
          <NativeSelectOption value="all">Toutes complétudes</NativeSelectOption>
          <NativeSelectOption value="complete">Complets ({counts.complete})</NativeSelectOption>
          <NativeSelectOption value="incomplete">À compléter ({counts.incomplete})</NativeSelectOption>
        </NativeSelect>
      </Card>

      {/* barre d'actions groupées */}
      {checked.size > 0 && (
        <Card className="flex flex-wrap items-center gap-2 border-primary/30 bg-primary/5 p-3">
          <span className="text-sm font-medium">{checked.size} sélectionné(s)</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={bulkRelance}>Relancer</Button>
          <Button variant="outline" size="sm" onClick={() => exportMembersCSV(data)}>Exporter</Button>
          <Button variant="destructive" size="sm" onClick={() => setConfirmBulk(true)}>Supprimer</Button>
          <Button variant="ghost" size="sm" onClick={() => setChecked(new Set())}>Annuler</Button>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(v) => setChecked(v ? new Set(list.map((m) => m.id)) : new Set())}
                  aria-label="Tout sélectionner"
                />
              </TableHead>
              <TableHead>Membre</TableHead>
              <TableHead>Pôle / Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Pièces</TableHead>
              <TableHead>Complétude</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
            {list.map((m) => {
              const s = dossierStats(data, m);
              return (
                <TableRow key={m.id} className={checked.has(m.id) ? "bg-primary/5" : undefined}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={checked.has(m.id)} onCheckedChange={() => toggle(m.id)} aria-label={`Sélectionner ${m.first}`} />
                  </TableCell>
                  <TableCell>
                    <Link href={`${base}/membres/${m.id}`} className="flex items-center gap-3">
                      <SgAvatar member={m} size={36} />
                      <div>
                        <div className="text-sm font-medium">{m.first} {m.last}</div>
                        <div className="text-xs text-muted-foreground">{m.year} · {m.email}</div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{m.pole}</div>
                    <div className="text-xs text-muted-foreground">{m.role}</div>
                  </TableCell>
                  <TableCell><StatusBadge status={m.status} /></TableCell>
                  <TableCell><DocDots member={m} docTypes={data.docTypes} /></TableCell>
                  <TableCell><CompletenessBar pct={s.pct} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <MemberFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ImportMembersDialog open={importOpen} onOpenChange={setImportOpen} />
      <ImportMembersDialog open={driveImportOpen} onOpenChange={setDriveImportOpen} driveFocus />

      <AlertDialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {checked.size} dossier(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les dossiers sélectionnés et leur suivi de pièces seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                mutate(mutations.deleteMembers([...checked]));
                toast.success(`${checked.size} dossier(s) supprimé(s)`);
                setChecked(new Set());
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
