"use client";

import { CrmDayPickerField } from "@myster/_components/crm-day-picker-field";
import { localYmdToUtcIsoEnd, localYmdToUtcIsoStart } from "@myster/_lib/crm-day";
import {
  CRM_SECTEUR_SELECT_EMPTY,
  CRM_SECTEURS_OPTIONS,
  isKnownCrmSecteur,
} from "@myster/_lib/crm-secteurs";
import { useState } from "react";
import { toast } from "sonner";
import { PRETEXT, PretextBlock } from "@/components/typography";
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
import { Switch } from "@/components/ui/switch";

export type CrmSprintNewSectionProps = {
  onBack: () => void;
  onCreated: (sprintId: string) => void;
};

export function CrmSprintNewSection({ onBack, onCreated }: CrmSprintNewSectionProps) {
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n || !dateStart || !dateEnd) {
      toast.error("Nom et dates obligatoires.");
      return;
    }
    if (dateEnd < dateStart) {
      toast.error("La date de fin doit être au même jour ou après le début.");
      return;
    }
    const isoStart = localYmdToUtcIsoStart(dateStart);
    const isoEnd = localYmdToUtcIsoEnd(dateEnd);
    if (!isoStart || !isoEnd) {
      toast.error("Dates invalides.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/app/crm/sprints", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: n,
          theme: theme.trim() || undefined,
          dateStart: isoStart,
          dateEnd: isoEnd,
          isPublic,
        }),
      });
      if (res.status === 403) {
        toast.error("Permission refusée (crm.sprint.create).");
        return;
      }
      if (!res.ok) {
        toast.error("Création impossible.");
        return;
      }
      const json: { sprint?: { id: string } } = await res.json();
      toast.success("Sprint créé.");
      if (json.sprint?.id) {
        onCreated(json.sprint.id);
      } else {
        onBack();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      <div>
        <PretextBlock as="h2" metric={PRETEXT.smMedium} text="Nouveau sprint" />
        <PretextBlock
          as="p"
          metric={PRETEXT.sm}
          text="Définissez la période, le secteur (NAF) et la visibilité."
          className="mt-1 text-muted-foreground"
        />
      </div>
      <Card>
        <CardHeader>
          <Button type="button" variant="ghost" size="sm" className="w-fit px-0" onClick={onBack}>
            ← Liste des sprints
          </Button>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => void submit(e)}>
            <div className="grid gap-1">
              <Label htmlFor="sn">Nom *</Label>
              <Input id="sn" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="st">Secteur (NAF rév. 2)</Label>
              <Select
                value={
                  !theme
                    ? CRM_SECTEUR_SELECT_EMPTY
                    : isKnownCrmSecteur(theme)
                      ? theme
                      : "__legacy__"
                }
                onValueChange={(v) =>
                  setTheme(v === CRM_SECTEUR_SELECT_EMPTY ? "" : v === "__legacy__" ? theme : v)
                }
              >
                <SelectTrigger id="st" className="w-full">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent className="max-h-[min(70vh,28rem)]">
                  {theme && !isKnownCrmSecteur(theme) ? (
                    <SelectItem value="__legacy__">{theme} (donnée existante)</SelectItem>
                  ) : null}
                  {CRM_SECTEURS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CrmDayPickerField
              id="ds"
              label="Date de début (jour) *"
              value={dateStart}
              onChange={setDateStart}
            />
            <CrmDayPickerField
              id="de"
              label="Date de fin (jour) *"
              value={dateEnd}
              onChange={setDateEnd}
            />
            <div className="flex items-center gap-2">
              <Switch id="pub" checked={isPublic} onCheckedChange={setIsPublic} />
              <Label htmlFor="pub">Sprint public (inscription libre)</Label>
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Création…" : "Créer le sprint"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
