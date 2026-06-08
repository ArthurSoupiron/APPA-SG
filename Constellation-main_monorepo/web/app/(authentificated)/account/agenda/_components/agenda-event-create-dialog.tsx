"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useUbacSession } from "@/lib/ubac-session-context";

import {
  createAgendaEvent,
  fetchAgendaTypes,
  fetchAgendaWorkspaceGroups,
} from "../_lib/agenda-api";
import {
  AGENDA_POLE_LABELS,
  AGENDA_RECURRENCE_NONE,
  AGENDA_RECURRENCE_PRESETS,
} from "../_lib/agenda-pole-labels";
import type { AgendaEventDetail, AgendaPole, AgendaWorkspaceGroupOption } from "../_lib/agenda-types";

const POLES: AgendaPole[] = [
  "crm",
  "marketing",
  "rh",
  "tresorerie",
  "si",
  "operations",
  "presidence",
  "erp",
  "academy",
  "rfp",
];

export function AgendaEventCreateDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (detail: AgendaEventDetail) => void;
}) {
  const { hasPermission } = useUbacSession();
  const writablePoles = POLES.filter(
    (p) => hasPermission(`agenda.${p}.write`) || hasPermission(`agenda.${p}.manage`),
  );

  const [pole, setPole] = useState<AgendaPole>(writablePoles[0] ?? "crm");
  const [typeId, setTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [audienceGroupIds, setAudienceGroupIds] = useState<string[]>([]);
  const [workspaceGroups, setWorkspaceGroups] = useState<AgendaWorkspaceGroupOption[]>([]);
  const [createGoogleMeet, setCreateGoogleMeet] = useState(true);
  const [location, setLocation] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [recurrenceRule, setRecurrenceRule] = useState(AGENDA_RECURRENCE_NONE);
  const [types, setTypes] = useState<{ id: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!props.open) return;
    void fetchAgendaWorkspaceGroups().then(setWorkspaceGroups);
    void fetchAgendaTypes(pole).then((rows) => {
      const active = rows.filter((t) => t.isActive);
      setTypes(active.map((t) => ({ id: t.id, label: t.label })));
      setTypeId(active[0]?.id ?? "");
    });
  }, [props.open, pole]);

  function toggleAudienceGroup(id: string) {
    setAudienceGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function groupLabel(g: AgendaWorkspaceGroupOption) {
    return g.name ? `${g.name} (${g.email})` : g.email;
  }

  async function submit() {
    if (!typeId || !title.trim() || !startsAt || !endsAt || audienceGroupIds.length === 0) {
      setError("Renseignez le titre, les dates et au moins un groupe d’audience.");
      return;
    }
    setError(null);
    setSaving(true);
    const detail = await createAgendaEvent({
      pole,
      typeId,
      title: title.trim(),
      description,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      allDay,
      status,
      audienceGroupIds,
      createGoogleMeet,
      location: location.trim() || undefined,
      driveUrl: driveUrl.trim() || undefined,
      recurrenceRule:
        recurrenceRule && recurrenceRule !== AGENDA_RECURRENCE_NONE ? recurrenceRule : undefined,
    });
    setSaving(false);
    if (detail) {
      props.onCreated(detail);
      props.onOpenChange(false);
    }
  }

  const canSubmit =
    Boolean(typeId && title.trim() && startsAt && endsAt && audienceGroupIds.length > 0);

  if (writablePoles.length === 0) return null;

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel événement</DialogTitle>
          <DialogDescription>
            Visibilité par groupes Google Workspace (UBAC). Un lien Meet peut être généré
            automatiquement via votre compte Google.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agenda-pole">Pôle</Label>
            <Select value={pole} onValueChange={(v) => setPole(v as AgendaPole)}>
              <SelectTrigger id="agenda-pole">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {writablePoles.map((p) => (
                  <SelectItem key={p} value={p}>
                    {AGENDA_POLE_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agenda-type">Type</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger id="agenda-type">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agenda-title">Titre</Label>
            <Input
              id="agenda-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agenda-desc">Description</Label>
            <Textarea
              id="agenda-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agenda-start">Début</Label>
              <Input
                id="agenda-start"
                type={allDay ? "date" : "datetime-local"}
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda-end">Fin</Label>
              <Input
                id="agenda-end"
                type={allDay ? "date" : "datetime-local"}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="size-4 rounded border"
            />
            Journée entière
          </label>

          <div className="space-y-2">
            <Label htmlFor="agenda-status">Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
              <SelectTrigger id="agenda-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Audiences (groupes Google Workspace UBAC)</Label>
            {workspaceGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground whitespace-normal break-words">
                Aucun groupe UBAC chargé. Vérifiez la synchronisation des groupes Workspace.
              </p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {workspaceGroups.map((g) => (
                  <li key={g.id}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={audienceGroupIds.includes(g.id)}
                        onChange={() => toggleAudienceGroup(g.id)}
                        className="mt-0.5 size-4 shrink-0 rounded border"
                      />
                      <span className="whitespace-normal break-words">{groupLabel(g)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={createGoogleMeet}
              onChange={(e) => setCreateGoogleMeet(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border"
            />
            <span className="whitespace-normal break-words">
              Créer un lien Google Meet automatiquement (compte Google connecté, scope Calendar
              requis)
            </span>
          </label>

          <div className="space-y-2">
            <Label htmlFor="agenda-location">Lieu (optionnel)</Label>
            <Input
              id="agenda-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agenda-drive">Lien Drive (optionnel)</Label>
            <Input
              id="agenda-drive"
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agenda-recurrence">Récurrence</Label>
            <Select value={recurrenceRule} onValueChange={setRecurrenceRule}>
              <SelectTrigger id="agenda-recurrence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENDA_RECURRENCE_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p className="text-sm text-destructive whitespace-normal break-words">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={!canSubmit || saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
