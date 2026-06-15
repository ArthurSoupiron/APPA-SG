"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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

import { cn } from "@/lib/utils";
import { gedCount, mutations, useSg } from "../_lib/sg-store";
import { exportDocsCSV } from "../_lib/sg-utils";
import type { GedDoc } from "../_lib/sg-types";
import { listSgDriveFiles, uploadSgDocument, type SgDriveFile } from "../_lib/sg-api";
import { SignDocumentDialog, SignaturePreview } from "./sg-signature-pad";

const STATUS_BADGE: Record<GedDoc["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  signed: { label: "Signé", variant: "default" },
  pending: { label: "À signer", variant: "secondary" },
  archived: { label: "Archivé", variant: "outline" },
};

export function SgDocuments() {
  const { data, mutate } = useSg();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [signDoc, setSignDoc] = useState<GedDoc | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    let xs = data.docs.slice();
    if (cat === "fav") xs = xs.filter((d) => d.fav);
    else if (cat === "tosign") xs = xs.filter((d) => d.status === "pending");
    else if (cat !== "all") xs = xs.filter((d) => d.cat === cat);
    if (q.trim()) {
      const qq = q.toLowerCase();
      xs = xs.filter((d) => d.title.toLowerCase().includes(qq) || d.ref.toLowerCase().includes(qq) || d.tags.some((t) => t.includes(qq)));
    }
    return xs.sort((a, b) => b.dateAbs.localeCompare(a.dateAbs));
  }, [data.docs, cat, q]);

  const toggle = (id: string) =>
    setChecked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const cats = [
    { id: "all", label: "Tous les documents" },
    ...data.gedCats,
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{data.docs.length} documents centralisés · cloud chiffré · accès tracé</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportDocsCSV(data)}>Exporter</Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>Importer depuis Drive</Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>Déposer un document</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* catégories */}
        <Card className="h-fit p-2">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm",
                cat === c.id ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              <span className="truncate">{c.label}</span>
              <span className="text-xs">{gedCount(data, c.id)}</span>
            </button>
          ))}
          <div className="my-2 border-t border-border" />
          <button
            type="button"
            onClick={() => setCat("tosign")}
            className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm", cat === "tosign" ? "bg-primary/10 font-medium text-primary" : "text-amber-600 hover:bg-muted/60")}
          >
            <span>À signer</span>
            <span className="text-xs">{data.docs.filter((d) => d.status === "pending").length}</span>
          </button>
          <button
            type="button"
            onClick={() => setCat("fav")}
            className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm", cat === "fav" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted/60")}
          >
            <span>Favoris</span>
            <span className="text-xs">{data.docs.filter((d) => d.fav).length}</span>
          </button>
        </Card>

        {/* liste */}
        <Card className="overflow-hidden p-0">
          {checked.size > 0 ? (
            <div className="flex items-center gap-2 border-b border-border bg-primary/5 p-3">
              <span className="text-sm font-medium">{checked.size} sélectionné(s)</span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => { [...checked].forEach((id) => mutate(mutations.setGedStatus(id, "archived"))); setChecked(new Set()); toast.success("Documents archivés"); }}>Archiver</Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmBulk(true)}>Supprimer</Button>
              <Button variant="ghost" size="sm" onClick={() => setChecked(new Set())}>Annuler</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-b border-border p-3">
              <Input className="h-9" placeholder="Rechercher un document, une référence…" value={q} onChange={(e) => setQ(e.target.value)} />
              <Badge variant="outline">{filtered.length}</Badge>
            </div>
          )}

          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucun document.</p>
            )}
            {filtered.map((d) => {
              const author = data.members.find((m) => m.id === d.author);
              const sb = STATUS_BADGE[d.status];
              return (
                <div key={d.id} className={cn("flex items-center gap-3 px-4 py-3", checked.has(d.id) && "bg-primary/5")}>
                  <Checkbox checked={checked.has(d.id)} onCheckedChange={() => toggle(d.id)} aria-label={`Sélectionner ${d.title}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{d.title}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{d.format} · {d.pages} p.</span>
                      <span className="font-mono">{d.ref}</span>
                      {author && <span>· {author.first} {author.last[0]}.</span>}
                    </div>
                  </div>
                  {d.signature && <SignaturePreview src={d.signature} />}
                  <Badge variant={sb.variant}>{sb.label}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => mutate(mutations.toggleGedFav(d.id))}
                    className={d.fav ? "text-amber-500" : "text-muted-foreground"}
                  >
                    ★
                  </Button>
                  {d.driveWebViewLink && (
                    <a href={d.driveWebViewLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Drive</a>
                  )}
                  {d.status === "pending" && (
                    <Button size="sm" onClick={() => setSignDoc(d)}>Signer</Button>
                  )}
                  {d.status === "signed" && (
                    <Button size="sm" variant="outline" onClick={() => mutate(mutations.setGedStatus(d.id, "archived"))}>Archiver</Button>
                  )}
                  {d.status === "archived" && (
                    <Button size="sm" variant="ghost" onClick={() => mutate(mutations.setGedStatus(d.id, "pending"))}>Réactiver</Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <NewDocDialog open={createOpen} onOpenChange={setCreateOpen} />

      <SignDocumentDialog
        doc={signDoc}
        onOpenChange={(v) => { if (!v) setSignDoc(null); }}
        onSign={(signature, signedBy) => {
          if (!signDoc) return;
          mutate(mutations.signGedDoc(signDoc.id, { signature, signedBy }));
          toast.success("Document signé");
          setSignDoc(null);
        }}
      />

      <ImportDriveDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {checked.size} document(s) ?</AlertDialogTitle>
            <AlertDialogDescription>Les documents sélectionnés seront retirés de la GED.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { mutate(mutations.deleteGedDocs([...checked])); toast.success(`${checked.size} document(s) supprimé(s)`); setChecked(new Set()); }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NewDocDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data, mutate } = useSg();
  const [f, setF] = useState({ title: "", cat: "cr", security: "Interne", status: "pending", pages: "", tags: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const valid = f.title.trim();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Déposer un document</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Titre *</Label>
            <Input value={f.title} onChange={(e) => set("title")(e.target.value)} placeholder="CR Bureau — 5 mai 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Catégorie</Label>
              <NativeSelect className="w-full" value={f.cat} onChange={(e) => set("cat")(e.target.value)}>
                {data.gedCats.map((c) => <NativeSelectOption key={c.id} value={c.id}>{c.label}</NativeSelectOption>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Confidentialité</Label>
              <NativeSelect className="w-full" value={f.security} onChange={(e) => set("security")(e.target.value)}>
                {["Public", "Interne", "Confidentiel"].map((s) => <NativeSelectOption key={s} value={s}>{s}</NativeSelectOption>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Statut</Label>
              <NativeSelect className="w-full" value={f.status} onChange={(e) => set("status")(e.target.value)}>
                <NativeSelectOption value="pending">À signer</NativeSelectOption>
                <NativeSelectOption value="signed">Signé</NativeSelectOption>
                <NativeSelectOption value="archived">Archivé</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pages</Label>
              <Input type="number" value={f.pages} onChange={(e) => set("pages")(e.target.value)} placeholder="4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tags (séparés par des virgules)</Label>
            <Textarea value={f.tags} onChange={(e) => set("tags")(e.target.value)} placeholder="bureau, vote" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fichier (optionnel — envoyé sur Google Drive)</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            disabled={!valid || uploading}
            onClick={async () => {
              let drive: Partial<GedDoc> = {};
              if (file) {
                setUploading(true);
                const up = await uploadSgDocument(file);
                setUploading(false);
                if (!up) {
                  toast.error("Échec de l'envoi vers Drive (compte Drive lié ?).");
                  return;
                }
                drive = {
                  driveFileId: up.driveFileId,
                  driveWebViewLink: up.webViewLink ?? undefined,
                  format: file.name.split(".").pop()?.toUpperCase() || "PDF",
                  size: up.size,
                };
              }
              mutate(mutations.addGedDoc({
                title: f.title,
                cat: f.cat,
                security: f.security as GedDoc["security"],
                status: f.status as GedDoc["status"],
                pages: Number(f.pages) || 1,
                tags: f.tags,
                ...drive,
              }));
              toast.success(file ? "Document déposé sur Drive" : "Document déposé");
              setFile(null);
              onOpenChange(false);
            }}
          >
            {uploading ? "Envoi…" : "Déposer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDriveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { mutate } = useSg();
  const [files, setFiles] = useState<SgDriveFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listSgDriveFiles().then((fs) => {
      setFiles(fs);
      setLoading(false);
    });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer depuis Google Drive</DialogTitle>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-1 overflow-auto">
          {loading && <p className="py-6 text-center text-sm text-muted-foreground">Chargement…</p>}
          {!loading && files.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun fichier (dossier Drive SG vide ou non configuré).
            </p>
          )}
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60">
              <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  mutate(mutations.addGedDocFromDrive({
                    title: file.name,
                    driveFileId: file.id,
                    driveWebViewLink: file.webViewLink,
                    format: file.name.split(".").pop()?.toUpperCase() || "Drive",
                  }));
                  toast.success("Document importé");
                }}
              >
                Importer
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
