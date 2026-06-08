"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

import { SI_TICKET_CATEGORY_LABELS } from "../_lib/si-ticket-status";
import { createSiTicket } from "../_lib/si-ticket-api";
import type { SiTicketCategory, SiTicketDetail } from "../_lib/si-ticket-types";
import { SiTicketFileUpload } from "./si-ticket-file-upload";

export function SiTicketCreateDialog(props: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated: (detail: SiTicketDetail) => void;
  trigger?: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = props.open ?? internalOpen;
  const setOpen = props.onOpenChange ?? setInternalOpen;
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SiTicketCategory>("autre");
  const [files, setFiles] = useState<File[]>([]);

  async function submit() {
    setBusy(true);
    const form = new FormData();
    form.set("title", title.trim());
    form.set("description", description.trim());
    form.set("category", category);
    for (const f of files) form.append("files", f, f.name);
    const detail = await createSiTicket(form);
    setBusy(false);
    if (!detail) return;
    setOpen(false);
    setTitle("");
    setDescription("");
    setCategory("autre");
    setFiles([]);
    props.onCreated(detail);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {props.trigger ? <DialogTrigger asChild>{props.trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau ticket SI</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="si-ticket-title">Titre</Label>
            <Input
              id="si-ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="si-ticket-desc">Description</Label>
            <Textarea
              id="si-ticket-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="min-h-24"
            />
          </div>
          <div className="space-y-2">
            <Label>Type de demande</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as SiTicketCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SI_TICKET_CATEGORY_LABELS) as SiTicketCategory[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {SI_TICKET_CATEGORY_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choisissez le type qui décrit le mieux votre demande.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Pièces jointes</Label>
            <SiTicketFileUpload files={files} onFilesChange={setFiles} disabled={busy} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !title.trim() || !description.trim()}
          >
            {busy ? <Spinner className="size-4" /> : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
