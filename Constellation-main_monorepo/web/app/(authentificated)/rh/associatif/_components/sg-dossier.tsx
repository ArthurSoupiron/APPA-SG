"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useRouter } from "next/navigation";
import { dossierStats, mutations, useSg } from "../_lib/sg-store";
import type { DocState, Member } from "../_lib/sg-types";
import { Ring, SgAvatar, StatusBadge } from "./sg-bits";
import { MemberFormDialog } from "./sg-member-dialogs";

const STATE_META: Record<DocState, { label: string; cls: string }> = {
  ok: { label: "Présent", cls: "bg-primary/10 text-primary" },
  pending: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  missing: { label: "Manquant", cls: "bg-destructive/10 text-destructive" },
};

export function SgDossier({ memberId }: { memberId: string }) {
  const { data, mutate } = useSg();
  const router = useRouter();
  const m = data.members.find((x) => x.id === memberId);
  const [editOpen, setEditOpen] = useState(false);
  const [mandateOpen, setMandateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!m) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">Membre introuvable</p>
          <Link href="/rh/associatif/membres" className="text-sm text-primary hover:underline">
            Retour à l'annuaire
          </Link>
        </CardContent>
      </Card>
    );
  }

  const s = dossierStats(data, m);
  const mandates = m.mandates ?? [{ role: m.role, period: `Depuis ${m.joined}`, current: true }];

  const relance = () => {
    const missing = data.docTypes.filter((d) => d.required && m.docs[d.code] !== "ok");
    if (!missing.length) {
      toast.info(`Dossier de ${m.first} déjà complet`);
      return;
    }
    const lines = missing.map((p) => `  - ${p.label} (${m.docs[p.code] === "pending" ? "en attente" : "manquante"})`);
    const subject = `[JEECE · SG] Dossier membre à compléter — ${m.first} ${m.last}`;
    const body = `Bonjour ${m.first},\n\nMerci de fournir les pièces suivantes dès que possible :\n\n${lines.join("\n")}\n\nLe Secrétariat Général · JEECE`;
    window.location.href = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success(`Relance préparée pour ${m.first}`);
  };

  return (
    <div className="space-y-4">
      <Link href="/rh/associatif/membres" className="text-sm text-muted-foreground hover:underline">
        ← Membres
      </Link>

      {/* En-tête dossier */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 pt-6">
          <SgAvatar member={m} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{m.first} {m.last}</h2>
              <StatusBadge status={m.status} />
              <Badge variant="outline">{m.pole}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {m.role} · ECE Paris · Promo {m.promo} · membre depuis {m.joined}
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>{m.email}</span>
              <span>{m.phone}</span>
              <span>{m.city}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Ring pct={s.pct} size={66} />
            <span className="text-xs text-muted-foreground">Dossier {s.pct}%</span>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Éditer</Button>
            {s.pct < 100 && m.status !== "alumni" && (
              <Button variant="outline" size="sm" onClick={relance}>Relancer ({s.missing + s.pending})</Button>
            )}
            <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>Supprimer</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dossier">
        <TabsList>
          <TabsTrigger value="dossier">Dossier & pièces</TabsTrigger>
          <TabsTrigger value="identite">Identité</TabsTrigger>
          <TabsTrigger value="parcours">Parcours</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        {/* Pièces */}
        <TabsContent value="dossier" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Pièces du dossier</CardTitle>
              {s.pct === 100 ? (
                <Badge>Dossier complet</Badge>
              ) : (
                <Badge variant="secondary">{s.missing + s.pending} à fournir</Badge>
              )}
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {data.docTypes.map((d) => {
                const v = m.docs[d.code] ?? "missing";
                const meta = STATE_META[v];
                return (
                  <div key={d.code} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {d.label}{" "}
                        {!d.required && <span className="text-xs font-normal text-muted-foreground">· optionnel</span>}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">{d.code}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                    {v === "missing" && (
                      <Button size="sm" onClick={() => mutate(mutations.setDocStatus(m.id, d.code, "pending"))}>Ajouter</Button>
                    )}
                    {v === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => mutate(mutations.setDocStatus(m.id, d.code, "ok"))}>Valider</Button>
                    )}
                    {v === "ok" && (
                      <Button size="sm" variant="ghost" onClick={() => mutate(mutations.setDocStatus(m.id, d.code, "missing"))}>Retirer</Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Identité */}
        <TabsContent value="identite" className="mt-4">
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {([
                ["Prénom", m.first],
                ["Nom", m.last],
                ["Date de naissance", m.birth ?? "—"],
                ["Email JEECE", m.email],
                ["Téléphone", m.phone],
                ["Ville", m.city],
                ["Adresse", m.address ?? "—"],
                ["N° étudiant", m.studentId ?? "—"],
                ["Promotion", `${m.year} · diplôme ${m.promo}`],
                ["Identifiant JEECE", m.jeeceId ?? `JE-2024-${m.id.toUpperCase()}`],
              ] as const).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[180px_1fr] px-4 py-2.5 text-sm">
                  <div className="text-muted-foreground">{k}</div>
                  <div>{v}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parcours */}
        <TabsContent value="parcours" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Parcours JEECE</CardTitle>
              <Button size="sm" onClick={() => setMandateOpen(true)}>Ajouter un mandat</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {mandates.map((md, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-1 size-3 rounded-full ${md.current ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{md.role}</div>
                    <div className="text-xs text-muted-foreground">{md.period}</div>
                    {md.current && <Badge className="mt-1">Mandat en cours</Badge>}
                  </div>
                  {Array.isArray(m.mandates) && (
                    <div className="flex gap-1">
                      {md.current && (
                        <Button size="sm" variant="ghost" onClick={() => mutate(mutations.endMandate(m.id, i))}>Clôturer</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => mutate(mutations.deleteMandate(m.id, i))}>Supprimer</Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="historique" className="mt-4">
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {data.activity
                .filter((a) => a.target.includes(`${m.first} ${m.last}`) || a.who === m.id)
                .map((a, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <div className="flex-1">
                      <span className="text-muted-foreground">{a.action}</span> <span className="font-medium">{a.target}</span>
                      <div className="text-xs text-muted-foreground">{a.ctx}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{a.when}</span>
                  </div>
                ))}
              {data.activity.filter((a) => a.target.includes(`${m.first} ${m.last}`) || a.who === m.id).length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune entrée pour ce dossier.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MemberFormDialog open={editOpen} onOpenChange={setEditOpen} member={m} />
      <AddMandateDialog open={mandateOpen} onOpenChange={setMandateOpen} member={m} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le dossier de {m.first} {m.last} sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                mutate(mutations.deleteMember(m.id));
                toast.success("Dossier supprimé");
                router.push("/rh/associatif/membres");
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

function AddMandateDialog({
  open,
  onOpenChange,
  member,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member: Member;
}) {
  const { mutate } = useSg();
  const [role, setRole] = useState("");
  const [period, setPeriod] = useState("");
  const [current, setCurrent] = useState("true");
  const valid = role.trim() && period.trim();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un mandat</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Rôle / fonction</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="VP Communication" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Période</Label>
            <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Sept. 2025 → en cours" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mandat en cours ?</Label>
            <NativeSelect className="w-full" value={current} onChange={(e) => setCurrent(e.target.value)}>
              <NativeSelectOption value="true">Oui — mandat actuel</NativeSelectOption>
              <NativeSelectOption value="false">Non — mandat passé</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              mutate(mutations.addMandate(member.id, role, period, current === "true"));
              toast.success("Mandat ajouté");
              onOpenChange(false);
            }}
          >
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
