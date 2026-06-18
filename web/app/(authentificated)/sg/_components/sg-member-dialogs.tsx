"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import { fetchSgDriveFileContent, listSgDriveFiles, type SgDriveFile } from "../_lib/sg-api";
import { mutations, useSg, type NewMemberInput } from "../_lib/sg-store";
import type { Member } from "../_lib/sg-types";

const YEARS = ["L1", "L2", "L3", "M1", "M2", "Diplômé"];
const STATUSES: { value: string; label: string }[] = [
  { value: "active", label: "Actif" },
  { value: "pending", label: "Postulant" },
  { value: "alumni", label: "Alumni" },
  { value: "inactive", label: "Inactif" },
];

type FormState = NewMemberInput & { birth?: string; address?: string };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function MemberFormDialog({
  open,
  onOpenChange,
  member,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member?: Member;
  onCreated?: (id: string) => void;
}) {
  const { data, mutate } = useSg();
  const poles = Array.from(new Set(data.members.map((m) => m.pole)));
  const isEdit = Boolean(member);
  const [f, setF] = useState<FormState>(() =>
    member
      ? {
          first: member.first,
          last: member.last,
          email: member.email,
          role: member.role,
          pole: member.pole,
          year: member.year,
          status: member.status,
          phone: member.phone,
          city: member.city,
          birth: member.birth ?? "",
          address: member.address ?? "",
        }
      : { first: "", last: "", email: "", role: "", pole: poles[0] ?? "SI", year: "L1", status: "active", phone: "", city: "" },
  );
  const set = (k: keyof FormState) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const valid = (f.first ?? "").trim() && (f.last ?? "").trim();

  const submit = () => {
    if (!valid) return;
    if (isEdit && member) {
      mutate(mutations.updateMember(member.id, f as Partial<Member>));
      toast.success("Dossier mis à jour");
    } else {
      let newId = "";
      mutate((draft) => {
        const next = mutations.addMember(f)(draft);
        newId = next.members[next.members.length - 1]?.id ?? "";
        return next;
      });
      toast.success(`Dossier de ${f.first} ${f.last} créé`);
      if (newId) onCreated?.(newId);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Éditer l'identité" : "Nouveau dossier membre"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Prénom *"><Input value={f.first} onChange={(e) => set("first")(e.target.value)} placeholder="Léa" /></Field>
          <Field label="Nom *"><Input value={f.last} onChange={(e) => set("last")(e.target.value)} placeholder="Bernard" /></Field>
          <Field label="Email"><Input value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="auto : prenom.nom@jeece.fr" /></Field>
          <Field label="Téléphone"><Input value={f.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+33 6 …" /></Field>
          <Field label="Rôle"><Input value={f.role} onChange={(e) => set("role")(e.target.value)} placeholder="Chargé de mission" /></Field>
          <Field label="Pôle">
            <NativeSelect className="w-full" value={f.pole} onChange={(e) => set("pole")(e.target.value)}>
              {poles.map((p) => <NativeSelectOption key={p} value={p}>{p}</NativeSelectOption>)}
            </NativeSelect>
          </Field>
          <Field label="Année">
            <NativeSelect className="w-full" value={f.year} onChange={(e) => set("year")(e.target.value)}>
              {YEARS.map((y) => <NativeSelectOption key={y} value={y}>{y}</NativeSelectOption>)}
            </NativeSelect>
          </Field>
          <Field label="Statut">
            <NativeSelect className="w-full" value={f.status} onChange={(e) => set("status")(e.target.value)}>
              {STATUSES.map((s) => <NativeSelectOption key={s.value} value={s.value}>{s.label}</NativeSelectOption>)}
            </NativeSelect>
          </Field>
          <Field label="Ville"><Input value={f.city} onChange={(e) => set("city")(e.target.value)} placeholder="Paris 11e" /></Field>
          {isEdit && <Field label="Date de naissance"><Input value={f.birth} onChange={(e) => set("birth")(e.target.value)} placeholder="12 janvier 2004" /></Field>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={!valid}>{isEdit ? "Enregistrer" : "Créer le dossier"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ImportMembersDialog({ open, onOpenChange, driveFocus = false }: { open: boolean; onOpenChange: (v: boolean) => void; driveFocus?: boolean }) {
  const { mutate } = useSg();
  const [rows, setRows] = useState<NewMemberInput[]>([]);
  const [driveFiles, setDriveFiles] = useState<SgDriveFile[]>([]);
  const [driveFileId, setDriveFileId] = useState("");
  const [loadingDrive, setLoadingDrive] = useState(false);

  // À l'ouverture : liste les CSV du dossier Drive SG.
  useEffect(() => {
    if (!open) return;
    setRows([]);
    setDriveFileId("");
    listSgDriveFiles().then((files) =>
      setDriveFiles(files.filter((f) => f.name.toLowerCase().endsWith(".csv"))),
    );
  }, [open]);

  const parse = (text: string): NewMemberInput[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) return [];
    const sep = lines[0].includes(";") ? ";" : ",";
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
    const map: Record<string, keyof NewMemberInput> = {
      prénom: "first", prenom: "first", nom: "last", email: "email", téléphone: "phone", telephone: "phone",
      pôle: "pole", pole: "pole", rôle: "role", role: "role", année: "year", annee: "year", promo: "promo", statut: "status", ville: "city",
    };
    const head = lines[0].replace(/^﻿/, "").split(sep).map(norm);
    return lines.slice(1).map((line) => {
      const cells = line.split(sep);
      const o: Record<string, string> = {};
      head.forEach((h, i) => { const k = map[h]; if (k) o[k] = (cells[i] ?? "").trim(); });
      return o as NewMemberInput;
    }).filter((o) => o.first && o.last);
  };

  const applyParsed = (text: string) => {
    const parsed = parse(text);
    if (!parsed.length) { toast.error("Aucune ligne valide (colonnes Prénom / Nom requises)"); return; }
    setRows(parsed);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) { setRows([]); return; }
    try { applyParsed(await file.text()); } catch { toast.error("Lecture du fichier impossible"); }
  };

  const loadFromDrive = async () => {
    if (!driveFileId) return;
    setLoadingDrive(true);
    const content = await fetchSgDriveFileContent(driveFileId);
    setLoadingDrive(false);
    if (content == null) { toast.error("Lecture du fichier Drive impossible"); return; }
    applyParsed(content);
  };

  const submit = () => {
    if (!rows.length) return;
    mutate(mutations.importMembers(rows)); // dédup par email
    toast.success(`${rows.length} ligne(s) importée(s) (doublons ignorés)`);
    setRows([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{driveFocus ? "Importer des membres depuis Google Drive" : "Importer des membres (CSV)"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Colonnes reconnues : <strong>Prénom; Nom; Email; Téléphone; Pôle; Rôle; Année; Promo; Statut; Ville</strong>.
        </p>

        {!driveFocus && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Depuis un fichier</Label>
            <Input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Depuis Google Drive</Label>
          {driveFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun fichier .csv dans le dossier Drive (ou Drive non lié).</p>
          ) : (
            <div className="flex gap-2">
              <NativeSelect className="flex-1" value={driveFileId} onChange={(e) => setDriveFileId(e.target.value)}>
                <NativeSelectOption value="">Choisir un fichier…</NativeSelectOption>
                {driveFiles.map((f) => <NativeSelectOption key={f.id} value={f.id}>{f.name}</NativeSelectOption>)}
              </NativeSelect>
              <Button variant="outline" disabled={!driveFileId || loadingDrive} onClick={loadFromDrive}>
                {loadingDrive ? "Chargement…" : "Charger"}
              </Button>
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded-md bg-muted/50 p-3 text-sm">
            <strong>{rows.length}</strong> membre(s) prêts :
            {rows.slice(0, 8).map((r, i) => <div key={i}>· {r.first} {r.last}{r.pole ? ` — ${r.pole}` : ""}</div>)}
            {rows.length > 8 && <div className="text-muted-foreground">… et {rows.length - 8} autres</div>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={!rows.length}>Importer {rows.length ? `(${rows.length})` : ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
