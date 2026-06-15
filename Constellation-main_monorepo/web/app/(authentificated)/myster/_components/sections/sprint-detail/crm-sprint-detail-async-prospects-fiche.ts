import { toast } from "sonner";

import type { FicheFormState, Member, SpRow } from "./crm-sprint-detail-types";

export async function sprintDetailPatchProspect(
  id: string,
  prospectId: string,
  body: Record<string, unknown>,
  load: () => Promise<void>,
  opts?: { silent?: boolean; skipReload?: boolean },
): Promise<boolean> {
  const res = await fetch(
    `/api/app/crm/sprints/${encodeURIComponent(id)}/prospects/${encodeURIComponent(prospectId)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (res.status === 403) {
    if (!opts?.silent) toast.error("Action refusée.");
    return false;
  }
  if (!res.ok) {
    if (!opts?.silent) toast.error("Mise à jour impossible.");
    return false;
  }
  if (!opts?.silent) toast.success("Mis à jour.");
  if (!opts?.skipReload) await load();
  return true;
}

export async function sprintDetailRunBulkAssign(
  _id: string,
  userId: string | null,
  ids: string[],
  load: () => Promise<void>,
  setSelectedBulk: (s: Set<string>) => void,
  setBulkBusy: (v: boolean) => void,
  patchProspect: (
    prospectId: string,
    body: Record<string, unknown>,
    opts?: { silent?: boolean; skipReload?: boolean },
  ) => Promise<boolean>,
): Promise<void> {
  if (ids.length === 0) {
    toast.error("Aucun prospect ciblé.");
    return;
  }
  setBulkBusy(true);
  try {
    let ok = 0;
    for (const pid of ids) {
      const success = await patchProspect(
        pid,
        { assignedUserId: userId },
        { silent: true, skipReload: true },
      );
      if (success) ok++;
    }
    if (ok === 0) {
      toast.error("Aucune mise à jour — vérifiez les permissions.");
    } else if (ok < ids.length) {
      toast.error(`${ok}/${ids.length} mis à jour — vérifiez les permissions.`);
    } else {
      toast.success(`${ok} prospect(s) assigné(s).`);
    }
    setSelectedBulk(new Set());
    await load();
  } finally {
    setBulkBusy(false);
  }
}

export async function sprintDetailRandomAssignAmongMembers(
  id: string,
  members: Member[],
  scope: "unassigned" | "all",
  load: () => Promise<void>,
  setRandomBusy: (v: boolean) => void,
): Promise<void> {
  if (members.length === 0) {
    toast.error("Ajoutez au moins un membre au sprint pour l’assignation aléatoire.");
    return;
  }
  setRandomBusy(true);
  try {
    const res = await fetch(
      `/api/app/crm/sprints/${encodeURIComponent(id)}/prospects/assign-random`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      },
    );
    if (res.status === 403) {
      toast.error("Permission refusée (gestionnaire du sprint requis).");
      return;
    }
    if (res.status === 400) {
      const j: { error?: string } = await res.json().catch(() => ({}));
      toast.error(j.error === "no_members" ? "Aucun membre dans ce sprint." : "Requête invalide.");
      return;
    }
    if (!res.ok) {
      toast.error("Assignation aléatoire impossible.");
      return;
    }
    const json: { updated?: number } = await res.json();
    const n = json.updated ?? 0;
    if (n === 0) {
      toast.message(
        scope === "unassigned"
          ? "Aucun prospect non assigné à répartir."
          : "Aucun prospect dans ce sprint.",
      );
    } else {
      toast.success(`${n} prospect(s) assigné(s) au hasard parmi les membres.`);
    }
    await load();
  } finally {
    setRandomBusy(false);
  }
}

export async function sprintDetailOpenFiche(
  p: SpRow,
  setFicheRow: (r: SpRow) => void,
  setFicheOpen: (v: boolean) => void,
  setFicheLoading: (v: boolean) => void,
  setFicheForm: (f: FicheFormState | ((prev: FicheFormState) => FicheFormState)) => void,
): Promise<void> {
  setFicheRow(p);
  setFicheOpen(true);
  setFicheLoading(true);
  try {
    const res = await fetch(`/api/app/crm/prospects/${encodeURIComponent(p.prospectId)}`, {
      credentials: "include",
    });
    if (res.ok) {
      const j: { prospect?: Record<string, unknown> } = await res.json();
      const pr = j.prospect;
      if (pr) {
        setFicheForm({
          nom: String(pr.nom ?? ""),
          prenom: String(pr.prenom ?? ""),
          email: String(pr.email ?? ""),
          telephone: String(pr.telephone ?? ""),
          linkedin: String(pr.linkedin ?? ""),
          entreprise: String(pr.entreprise ?? ""),
          secteur: String(pr.secteur ?? ""),
          source: String(pr.source ?? ""),
          notes: String(pr.notes ?? ""),
          statut: String(pr.statut ?? "a_contacter"),
        });
        return;
      }
    }
    setFicheForm({
      nom: p.nom,
      prenom: p.prenom ?? "",
      email: p.email ?? "",
      telephone: p.telephone ?? "",
      linkedin: p.linkedin ?? "",
      entreprise: p.entreprise ?? "",
      secteur: p.secteur ?? "",
      source: p.source ?? "",
      notes: p.notes ?? "",
      statut: p.statut,
    });
  } finally {
    setFicheLoading(false);
  }
}

export async function sprintDetailSaveFiche(
  id: string,
  ficheRow: SpRow,
  sprintIsManager: boolean,
  currentUserId: string | undefined,
  ficheForm: FicheFormState,
  load: () => Promise<void>,
  setFicheSaving: (v: boolean) => void,
  setFicheOpen: (v: boolean) => void,
  setFicheRow: (r: SpRow | null) => void,
): Promise<void> {
  const mgr = sprintIsManager;
  if (!mgr && ficheRow.assignedUserId !== currentUserId) return;

  const nom = ficheForm.nom.trim();
  if (!nom) {
    toast.error("Le nom est obligatoire.");
    return;
  }

  setFicheSaving(true);
  try {
    const res = await fetch(
      `/api/app/crm/sprints/${encodeURIComponent(id)}/prospects/${encodeURIComponent(ficheRow.prospectId)}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          prenom: ficheForm.prenom || undefined,
          email: ficheForm.email || undefined,
          telephone: ficheForm.telephone || undefined,
          linkedin: ficheForm.linkedin || undefined,
          entreprise: ficheForm.entreprise || undefined,
          secteur: ficheForm.secteur || undefined,
          source: ficheForm.source || undefined,
          notes: ficheForm.notes || undefined,
          statut: ficheForm.statut,
        }),
      },
    );
    if (res.status === 403) {
      toast.error("Modification refusée.");
      return;
    }
    if (!res.ok) {
      const j: { error?: string } = await res.json().catch(() => ({}));
      toast.error(
        j.error === "nothing_to_update" ? "Aucun changement." : "Enregistrement impossible.",
      );
      return;
    }
    toast.success("Fiche mise à jour.");
    setFicheOpen(false);
    setFicheRow(null);
    await load();
  } finally {
    setFicheSaving(false);
  }
}

export async function sprintDetailOnImportFile(
  id: string,
  file: File,
  importAssigneeId: string,
  load: () => Promise<void>,
  setImportBusy: (v: boolean) => void,
): Promise<void> {
  setImportBusy(true);
  try {
    const fd = new FormData();
    fd.set("file", file);
    if (importAssigneeId) fd.set("assignedUserId", importAssigneeId);
    const res = await fetch(`/api/app/crm/sprints/${encodeURIComponent(id)}/prospects/import`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (res.status === 403) {
      toast.error("Permission refusée.");
      return;
    }
    if (!res.ok) {
      let detail = "Import impossible.";
      try {
        const err = (await res.json()) as { message?: string; error?: string };
        detail = err.message ?? err.error ?? detail;
      } catch {
        /* ignore */
      }
      toast.error(detail);
      return;
    }
    const json: { imported?: number } = await res.json();
    toast.success(`${json.imported ?? 0} prospect(s) importé(s).`);
    await load();
  } finally {
    setImportBusy(false);
  }
}
