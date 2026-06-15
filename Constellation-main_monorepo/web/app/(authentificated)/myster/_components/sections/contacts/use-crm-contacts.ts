"use client";

import type { CrmContactEventKind } from "@myster/_lib/crm-contact-event-kinds";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUbacSession } from "@/lib/ubac-client";

import { fetchCrmProspectDetail, fetchCrmProspectsPage } from "./crm-contacts-fetch";
import { saveCrmProspectMutation } from "./crm-contacts-mutations";
import { emptyForm, type Prospect, type ProspectTimelineEntry } from "./crm-contacts-types";

export function useCrmContacts() {
  const { hasPermission } = useUbacSession();
  const [loading, setLoading] = useState(true);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [form, setForm] = useState<Partial<Prospect>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetProspect, setSheetProspect] = useState<Prospect | null>(null);
  const [sheetTimeline, setSheetTimeline] = useState<ProspectTimelineEntry[]>([]);
  const [quickNote, setQuickNote] = useState("");
  const [quickNoteBusy, setQuickNoteBusy] = useState(false);
  const [quickEventKind, setQuickEventKind] = useState<CrmContactEventKind>("appel");
  const [quickEventBusy, setQuickEventBusy] = useState(false);

  const loadSheetDetail = useCallback(async (id: string) => {
    setSheetLoading(true);
    try {
      const data = await fetchCrmProspectDetail(id);
      if (!data) return;
      if (data.prospect) setSheetProspect(data.prospect);
      setSheetTimeline(data.timeline);
    } finally {
      setSheetLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCrmProspectsPage({ page, q, statutFilter });
      if (!data) return;
      setProspects(data.prospects);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, q, statutFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }, []);

  const openSheetFromRow = useCallback(
    (p: Prospect) => {
      setSheetProspect(p);
      setSheetTimeline([]);
      setSheetOpen(true);
      void loadSheetDetail(p.id);
    },
    [loadSheetDetail],
  );

  const openEdit = useCallback((p: Prospect) => {
    setEditing(p);
    setForm({
      nom: p.nom,
      prenom: p.prenom ?? "",
      email: p.email ?? "",
      telephone: p.telephone ?? "",
      linkedin: p.linkedin ?? "",
      entreprise: p.entreprise ?? "",
      secteur: p.secteur ?? "",
      source: p.source ?? "",
      statut: p.statut,
      notes: p.notes ?? "",
    });
    setDialogOpen(true);
  }, []);

  const saveProspect = useCallback(async () => {
    setSaving(true);
    try {
      const out = await saveCrmProspectMutation({
        editing,
        form,
        sheetOpen,
        sheetProspectId: sheetProspect?.id,
      });
      if (!out.ok) return;
      if (out.reloadSheetForId) void loadSheetDetail(out.reloadSheetForId);
      setDialogOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }, [form, editing, sheetOpen, sheetProspect?.id, load, loadSheetDetail]);

  const submitQuickNote = useCallback(async () => {
    if (!sheetProspect || !hasPermission("crm.write")) return;
    const text = quickNote.trim();
    if (!text) {
      toast.error("Saisissez une note.");
      return;
    }
    setQuickNoteBusy(true);
    try {
      const res = await fetch(
        `/api/app/crm/prospects/${encodeURIComponent(sheetProspect.id)}/notes`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        },
      );
      if (res.status === 403) {
        toast.error("Permission refusée (crm.write).");
        return;
      }
      if (!res.ok) {
        toast.error("Ajout de note impossible.");
        return;
      }
      const json: { prospect?: Prospect; timeline?: ProspectTimelineEntry[] } = await res.json();
      if (json.prospect) setSheetProspect(json.prospect);
      setSheetTimeline(json.timeline ?? []);
      setQuickNote("");
      toast.success("Note ajoutée.");
      await load();
    } finally {
      setQuickNoteBusy(false);
    }
  }, [sheetProspect, hasPermission, quickNote, load]);

  const submitQuickContactEvent = useCallback(async () => {
    if (!sheetProspect || !hasPermission("crm.write")) return;
    setQuickEventBusy(true);
    try {
      const res = await fetch(
        `/api/app/crm/prospects/${encodeURIComponent(sheetProspect.id)}/contact-events`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: quickEventKind, metadata: null }),
        },
      );
      if (res.status === 403) {
        toast.error("Permission refusée (crm.write).");
        return;
      }
      if (!res.ok) {
        toast.error("Enregistrement de l’interaction impossible.");
        return;
      }
      const json: { prospect?: Prospect; timeline?: ProspectTimelineEntry[] } = await res.json();
      if (json.prospect) setSheetProspect(json.prospect);
      setSheetTimeline(json.timeline ?? []);
      toast.success("Interaction enregistrée.");
      await load();
    } finally {
      setQuickEventBusy(false);
    }
  }, [sheetProspect, hasPermission, quickEventKind, load]);

  const removeProspect = useCallback(
    async (p: Prospect) => {
      if (!confirm(`Supprimer ${p.nom} ?`)) return;
      const res = await fetch(`/api/app/crm/prospects/${encodeURIComponent(p.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 403) {
        toast.error("Permission refusée (crm.delete).");
        return;
      }
      if (!res.ok) {
        toast.error("Suppression impossible.");
        return;
      }
      toast.success("Supprimé.");
      await load();
    },
    [load],
  );

  const onImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setImportBusy(true);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/app/crm/prospects/import", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (res.status === 403) {
          toast.error("Permission refusée (crm.write).");
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
        const json: { imported?: number; skipped?: number } = await res.json();
        toast.success(`Import : ${json.imported ?? 0} ligne(s), ${json.skipped ?? 0} ignorée(s).`);
        await load();
      } finally {
        setImportBusy(false);
      }
    },
    [load],
  );

  const exportUrl = useCallback((format: "csv" | "xlsx") => {
    return `/api/app/crm/prospects/export?format=${format}`;
  }, []);

  return {
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
    dialogOpen,
    setDialogOpen,
    editing,
    form,
    setForm,
    saving,
    importBusy,
    sheetOpen,
    setSheetOpen,
    sheetLoading,
    sheetProspect,
    sheetTimeline,
    quickNote,
    setQuickNote,
    quickNoteBusy,
    quickEventKind,
    setQuickEventKind,
    quickEventBusy,
    load,
    loadSheetDetail,
    openCreate,
    openSheetFromRow,
    openEdit,
    saveProspect,
    submitQuickNote,
    submitQuickContactEvent,
    removeProspect,
    onImportFile,
    exportUrl,
    setSheetProspect,
    setSheetTimeline,
  };
}
