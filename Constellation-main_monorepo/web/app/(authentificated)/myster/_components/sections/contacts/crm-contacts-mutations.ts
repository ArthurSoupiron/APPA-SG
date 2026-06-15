import { toast } from "sonner";

import type { Prospect } from "./crm-contacts-types";

export type SaveCrmProspectOutcome = { ok: true; reloadSheetForId?: string } | { ok: false };

export async function saveCrmProspectMutation(args: {
  editing: Prospect | null;
  form: Partial<Prospect>;
  sheetOpen: boolean;
  sheetProspectId: string | undefined;
}): Promise<SaveCrmProspectOutcome> {
  const { editing, form, sheetOpen, sheetProspectId } = args;
  const nom = (form.nom ?? "").trim();
  if (!nom) {
    toast.error("Le nom est obligatoire.");
    return { ok: false };
  }

  if (editing) {
    const res = await fetch(`/api/app/crm/prospects/${encodeURIComponent(editing.id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom,
        prenom: form.prenom || undefined,
        email: form.email || undefined,
        telephone: form.telephone || undefined,
        linkedin: form.linkedin || undefined,
        entreprise: form.entreprise || undefined,
        secteur: form.secteur || undefined,
        source: form.source || undefined,
        statut: form.statut,
        notes: form.notes || undefined,
      }),
    });
    if (res.status === 403) {
      toast.error("Permission refusée (crm.write).");
      return { ok: false };
    }
    if (!res.ok) {
      toast.error("Mise à jour impossible.");
      return { ok: false };
    }
    toast.success("Prospect mis à jour.");
    if (sheetOpen && sheetProspectId === editing.id) {
      return { ok: true, reloadSheetForId: editing.id };
    }
    return { ok: true };
  }

  const res = await fetch("/api/app/crm/prospects", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nom,
      prenom: form.prenom || undefined,
      email: form.email || undefined,
      telephone: form.telephone || undefined,
      linkedin: form.linkedin || undefined,
      entreprise: form.entreprise || undefined,
      secteur: form.secteur || undefined,
      source: form.source || undefined,
      statut: form.statut ?? "a_contacter",
      notes: form.notes || undefined,
    }),
  });
  if (res.status === 403) {
    toast.error("Permission refusée (crm.write).");
    return { ok: false };
  }
  if (!res.ok) {
    toast.error("Création impossible.");
    return { ok: false };
  }
  toast.success("Prospect créé.");
  return { ok: true };
}
