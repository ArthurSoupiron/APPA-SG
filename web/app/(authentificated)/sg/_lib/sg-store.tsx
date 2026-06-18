"use client";

// Module SG — store client adossé au backend (BDD Postgres via /api/app/assoc).
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchSgState, saveSgState } from "./sg-api";
import { buildSeed } from "./sg-seed";
import { STATUS_LABEL } from "./sg-types";
import type {
  DocState,
  GedDoc,
  Member,
  MemberStatus,
  SgData,
} from "./sg-types";

type SgContextValue = {
  data: SgData;
  /** applique une transformation immuable de l'état puis persiste en base */
  mutate: (fn: (draft: SgData) => SgData) => void;
  reset: () => void;
};

const SgContext = createContext<SgContextValue | null>(null);

export function SgStoreProvider({ children }: { children: React.ReactNode }) {
  // buildSeed() fournit la config (docTypes, gedCats) ; le contenu (membres,
  // documents, échéances, conformité) est chargé depuis la base au montage.
  const [data, setData] = useState<SgData>(() => buildSeed());
  const latest = useRef<SgData>(data);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);

  const load = () => {
    fetchSgState().then((state) => {
      loaded.current = true;
      if (!state) return;
      setData((prev) => {
        const merged: SgData = {
          ...prev,
          members: state.members ?? [],
          docs: state.docs ?? [],
          deadlines: state.deadlines ?? [],
          conformite: state.conformite ?? [],
        };
        latest.current = merged;
        return merged;
      });
    });
  };

  useEffect(() => {
    load();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveSgState(latest.current);
    }, 500);
  };

  const mutate = (fn: (draft: SgData) => SgData) => {
    setData((prev) => {
      const next = fn(structuredClone(prev));
      latest.current = next;
      return next;
    });
    // ne persiste qu'après le chargement initial (évite d'écraser la base au boot)
    if (loaded.current) scheduleSave();
  };

  // Recharge l'état depuis la base (annule les éventuelles modifs locales non sauvées).
  const reset = () => {
    load();
  };

  const value = useMemo<SgContextValue>(() => ({ data, mutate, reset }), [data]);

  return <SgContext.Provider value={value}>{children}</SgContext.Provider>;
}

export function useSg(): SgContextValue {
  const ctx = useContext(SgContext);
  if (!ctx) throw new Error("useSg must be used within <SgStoreProvider>");
  return ctx;
}

// ---- Helpers dérivés -------------------------------------------------------

export function memberById(data: SgData, id: string): Member | undefined {
  return data.members.find((m) => m.id === id);
}

export function dossierStats(data: SgData, m: Member) {
  const req = data.docTypes.filter((d) => d.required);
  const ok = req.filter((d) => m.docs[d.code] === "ok").length;
  const pct = req.length ? Math.round((ok / req.length) * 100) : 0;
  return {
    ok,
    total: req.length,
    pct,
    missing: req.filter((d) => m.docs[d.code] === "missing").length,
    pending: req.filter((d) => m.docs[d.code] === "pending").length,
  };
}

export function rollups(data: SgData) {
  const complete = data.members.filter((m) => dossierStats(data, m).pct === 100).length;
  const incomplete = data.members.filter((m) => dossierStats(data, m).pct < 100);
  return {
    membersTotal: data.members.length,
    active: data.members.filter((m) => m.status === "active").length,
    pending: data.members.filter((m) => m.status === "pending").length,
    complete,
    completePct: data.members.length ? Math.round((complete / data.members.length) * 100) : 0,
    incomplete,
  };
}

export function gedCount(data: SgData, catId: string): number {
  if (catId === "all") return data.docs.length;
  return data.docs.filter((d) => d.cat === catId).length;
}

export function conformityScore(data: SgData): number {
  const okChecks = data.conformite.filter((c) => c.state === "ok").length;
  const dossiersOk = rollups(data).incomplete.length ? 0 : 1;
  return Math.round(((okChecks + dossiersOk) / (data.conformite.length + 1)) * 100);
}

export function conformityOpen(data: SgData): number {
  return data.conformite.filter((c) => c.state !== "ok").length + (rollups(data).incomplete.length ? 1 : 0);
}

// ---- Helpers statistiques --------------------------------------------------

/** Complétude moyenne des dossiers par pôle. */
export function statsByPole(data: SgData) {
  const map = new Map<string, { pole: string; count: number; sum: number }>();
  for (const m of data.members) {
    const e = map.get(m.pole) ?? { pole: m.pole, count: 0, sum: 0 };
    e.count += 1;
    e.sum += dossierStats(data, m).pct;
    map.set(m.pole, e);
  }
  return [...map.values()]
    .map((e) => ({ pole: e.pole, count: e.count, avg: Math.round(e.sum / Math.max(1, e.count)) }))
    .sort((a, b) => b.avg - a.avg);
}

/** Répartition des membres par statut. */
export function statsByStatus(data: SgData) {
  return (Object.keys(STATUS_LABEL) as MemberStatus[])
    .map((status) => ({
      status,
      label: STATUS_LABEL[status].k,
      tone: STATUS_LABEL[status].tone,
      count: data.members.filter((m) => m.status === status).length,
    }))
    .filter((s) => s.count > 0);
}

/** État agrégé des pièces requises sur l'ensemble des dossiers. */
export function statsPieces(data: SgData) {
  const required = data.docTypes.filter((d) => d.required);
  let ok = 0;
  let pending = 0;
  let missing = 0;
  for (const m of data.members) {
    for (const d of required) {
      const st = m.docs[d.code] ?? "missing";
      if (st === "ok") ok += 1;
      else if (st === "pending") pending += 1;
      else missing += 1;
    }
  }
  return { ok, pending, missing, total: ok + pending + missing };
}

/** Répartition des documents GED par statut. */
export function statsDocStatus(data: SgData) {
  return data.docs.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] ?? 0) + 1;
      return acc;
    },
    { signed: 0, pending: 0, archived: 0 } as Record<GedDoc["status"], number>,
  );
}

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export function deadlineInfo(date: string) {
  const dt = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((dt.getTime() - today.getTime()) / 86_400_000);
  const delta = days === 0 ? "Aujourd'hui" : days > 0 ? `J−${days}` : `J+${-days}`;
  const tone: "danger" | "warn" | "info" | "neutral" =
    days < 0 ? "danger" : days <= 21 ? "warn" : days <= 45 ? "info" : "neutral";
  return { day: String(dt.getDate()).padStart(2, "0"), mo: MONTHS_FR[dt.getMonth()], delta, tone, days };
}

// ---- Mutations (à utiliser via mutate()) -----------------------------------

function pushActivity(draft: SgData, entry: Partial<SgData["activity"][number]> & { action: string; target: string }) {
  draft.activity.unshift({
    who: "lb",
    ctx: "",
    when: "à l'instant",
    icon: "pencil-edit",
    tone: "brand",
    ...entry,
  });
  if (draft.activity.length > 40) draft.activity.length = 40;
}

function normStatus(s: string): MemberStatus {
  const v = (s || "").toLowerCase().trim();
  if (["active", "pending", "alumni", "inactive"].includes(v)) return v as MemberStatus;
  const map: Record<string, MemberStatus> = { actif: "active", postulant: "pending", alumni: "alumni", inactif: "inactive" };
  return map[v] ?? "active";
}

export type NewMemberInput = {
  first: string;
  last: string;
  email?: string;
  role?: string;
  pole?: string;
  year?: string;
  status?: string;
  phone?: string;
  city?: string;
  promo?: string | number;
};

export function makeMember(draft: SgData, input: NewMemberInput): Member {
  const first = (input.first || "").trim();
  const last = (input.last || "").trim();
  const initials = ((first[0] ?? "?") + (last[0] ?? "")).toUpperCase();
  let id = initials.toLowerCase() || "m";
  while (draft.members.some((m) => m.id === id)) id += Math.floor(Math.random() * 10);
  return {
    id,
    first,
    last,
    initials,
    role: input.role || "Membre actif",
    pole: input.pole || "Commercial",
    promo: Number(input.promo) || new Date().getFullYear() + 2,
    year: input.year || "ING1",
    status: normStatus(input.status ?? "active"),
    email: input.email || `${`${first}.${last}`.toLowerCase().replace(/\s+/g, "")}@jeece.fr`,
    phone: input.phone || "—",
    joined: new Date().toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
    city: input.city || "—",
    docs: { BA: "missing", CHARTE: "missing", CE: "missing", RIB: "missing", RC: "missing", CV: "missing" },
  };
}

export const mutations = {
  addMember: (input: NewMemberInput) => (draft: SgData): SgData => {
    const m = makeMember(draft, input);
    draft.members.push(m);
    pushActivity(draft, { action: "a créé le dossier de", target: `${m.first} ${m.last}`, ctx: "nouveau membre", icon: "user-add", tone: "brand" });
    return draft;
  },
  importMembers: (inputs: NewMemberInput[]) => (draft: SgData): SgData => {
    const seen = new Set(draft.members.map((m) => m.email.toLowerCase().trim()));
    let added = 0;
    for (const input of inputs) {
      const email = (input.email ?? "").toLowerCase().trim();
      if (email && seen.has(email)) continue; // pas de doublon (cf. cahier des charges SG)
      const m = makeMember(draft, input);
      draft.members.push(m);
      if (email) seen.add(email);
      added += 1;
    }
    if (added) pushActivity(draft, { action: "a importé", target: `${added} membre(s)`, ctx: "import CSV", icon: "user-add", tone: "brand" });
    return draft;
  },
  updateMember: (id: string, patch: Partial<Member>) => (draft: SgData): SgData => {
    const m = memberById(draft, id);
    if (!m) return draft;
    Object.assign(m, patch);
    if (patch.first || patch.last) m.initials = ((m.first[0] ?? "?") + (m.last[0] ?? "")).toUpperCase();
    pushActivity(draft, { action: "a mis à jour le dossier de", target: `${m.first} ${m.last}`, ctx: "identité éditée", icon: "pencil-edit", tone: "neutral" });
    return draft;
  },
  deleteMember: (id: string) => (draft: SgData): SgData => {
    const m = memberById(draft, id);
    draft.members = draft.members.filter((x) => x.id !== id);
    if (m) pushActivity(draft, { action: "a supprimé le dossier de", target: `${m.first} ${m.last}`, ctx: "suppression", icon: "delete-02", tone: "neutral" });
    return draft;
  },
  deleteMembers: (ids: string[]) => (draft: SgData): SgData => {
    const set = new Set(ids);
    const n = draft.members.filter((m) => set.has(m.id)).length;
    draft.members = draft.members.filter((m) => !set.has(m.id));
    if (n) pushActivity(draft, { action: "a supprimé", target: `${n} dossier(s) membre`, ctx: "action groupée", icon: "delete-02", tone: "neutral" });
    return draft;
  },
  setDocStatus: (memberId: string, code: string, status: DocState) => (draft: SgData): SgData => {
    const m = memberById(draft, memberId);
    if (!m) return draft;
    m.docs[code] = status;
    const label = draft.docTypes.find((d) => d.code === code)?.label ?? code;
    const verb = status === "ok" ? "a validé" : status === "pending" ? "a déposé" : "a retiré";
    pushActivity(draft, { action: verb, target: `${label} · ${m.first} ${m.last}`, ctx: "dossier membre", icon: status === "ok" ? "checkmark-circle-02" : "upload-04", tone: status === "ok" ? "brand" : "info" });
    return draft;
  },
  addMandate: (memberId: string, role: string, period: string, current: boolean) => (draft: SgData): SgData => {
    const m = memberById(draft, memberId);
    if (!m) return draft;
    if (!m.mandates) m.mandates = [{ role: m.role, period: `Depuis ${m.joined}`, current: true }];
    if (current) m.mandates.forEach((x) => { x.current = false; });
    m.mandates.unshift({ role, period, current });
    pushActivity(draft, { action: "a ajouté un mandat à", target: `${m.first} ${m.last}`, ctx: role, icon: "flag-02", tone: "info" });
    return draft;
  },
  endMandate: (memberId: string, idx: number) => (draft: SgData): SgData => {
    const m = memberById(draft, memberId);
    if (m?.mandates?.[idx]) m.mandates[idx].current = false;
    return draft;
  },
  deleteMandate: (memberId: string, idx: number) => (draft: SgData): SgData => {
    const m = memberById(draft, memberId);
    if (m?.mandates) m.mandates.splice(idx, 1);
    return draft;
  },
  addGedDoc: (input: Partial<GedDoc> & { title: string }) => (draft: SgData): SgData => {
    const cat = input.cat || "cr";
    const prefix: Record<string, string> = { ba: "BA", cr: "CR", pvag: "PV-AG", ri: "RI", statuts: "STAT", pref: "PREF", compta: "COMPTA", contrats: "CONV" };
    const now = new Date();
    const doc: GedDoc = {
      id: `g${draft.docs.length + 1}${Math.floor(Math.random() * 100)}`,
      title: input.title.trim(),
      cat,
      pages: Number(input.pages) || 1,
      format: input.format || "PDF",
      size: input.size || "—",
      mandat: "25–26",
      ref: input.ref || `${prefix[cat] ?? "DOC"}-2026-${100 + draft.docs.length}`,
      status: input.status || "pending",
      author: input.author || "lb",
      signers: [],
      date: now.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
      dateAbs: now.toISOString().slice(0, 10),
      tags: Array.isArray(input.tags) ? input.tags : typeof input.tags === "string" ? (input.tags as string).split(",").map((t) => t.trim()).filter(Boolean) : [],
      security: input.security || "Interne",
      fav: false,
    };
    draft.docs.unshift(doc);
    pushActivity(draft, { action: "a déposé", target: doc.title, ctx: `catégorie ${draft.gedCats.find((c) => c.id === cat)?.label ?? cat}`, icon: "upload-04", tone: "info" });
    return draft;
  },
  setGedStatus: (id: string, status: GedDoc["status"]) => (draft: SgData): SgData => {
    const d = draft.docs.find((x) => x.id === id);
    if (!d) return draft;
    d.status = status;
    const verb = status === "signed" ? "a signé" : status === "archived" ? "a archivé" : "a remis en attente";
    pushActivity(draft, { action: verb, target: d.title, ctx: "GED", icon: status === "signed" ? "pen-tool" : "archive", tone: status === "signed" ? "violet" : "neutral" });
    return draft;
  },
  signGedDoc: (id: string, sig: { signature: string; signedBy: string }) => (draft: SgData): SgData => {
    const d = draft.docs.find((x) => x.id === id);
    if (!d) return draft;
    d.status = "signed";
    d.signature = sig.signature;
    d.signedBy = sig.signedBy || "Secrétaire Général";
    d.signedAt = new Date().toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    pushActivity(draft, { action: "a signé", target: d.title, ctx: `signature numérique · ${d.signedBy}`, icon: "pen-tool", tone: "violet" });
    return draft;
  },
  addGedDocFromDrive: (input: { title: string; cat?: string; driveFileId: string; driveWebViewLink: string | null; format?: string; size?: string }) => (draft: SgData): SgData => {
    const cat = input.cat || "contrats";
    const now = new Date();
    const doc: GedDoc = {
      id: `g${draft.docs.length + 1}${Math.floor(Math.random() * 100)}`,
      title: input.title.trim(),
      cat,
      pages: 1,
      format: input.format || "Drive",
      size: input.size || "—",
      mandat: "25–26",
      ref: `DRIVE-2026-${100 + draft.docs.length}`,
      status: "pending",
      author: "",
      signers: [],
      date: now.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
      dateAbs: now.toISOString().slice(0, 10),
      tags: ["drive", "import"],
      security: "Interne",
      fav: false,
      driveFileId: input.driveFileId,
      driveWebViewLink: input.driveWebViewLink ?? undefined,
    };
    draft.docs.unshift(doc);
    pushActivity(draft, { action: "a importé depuis Drive", target: doc.title, ctx: "GED", icon: "google-drive", tone: "info" });
    return draft;
  },
  toggleGedFav: (id: string) => (draft: SgData): SgData => {
    const d = draft.docs.find((x) => x.id === id);
    if (d) d.fav = !d.fav;
    return draft;
  },
  deleteGedDoc: (id: string) => (draft: SgData): SgData => {
    const d = draft.docs.find((x) => x.id === id);
    draft.docs = draft.docs.filter((x) => x.id !== id);
    if (d) pushActivity(draft, { action: "a supprimé", target: d.title, ctx: "GED", icon: "delete-02", tone: "neutral" });
    return draft;
  },
  deleteGedDocs: (ids: string[]) => (draft: SgData): SgData => {
    const set = new Set(ids);
    const n = draft.docs.filter((d) => set.has(d.id)).length;
    draft.docs = draft.docs.filter((d) => !set.has(d.id));
    if (n) pushActivity(draft, { action: "a supprimé", target: `${n} document(s)`, ctx: "action groupée · GED", icon: "delete-02", tone: "neutral" });
    return draft;
  },
  advanceCheck: (id: string) => (draft: SgData): SgData => {
    const c = draft.conformite.find((x) => x.id === id);
    if (!c) return draft;
    c.state = c.state === "todo" ? "pending" : "ok";
    pushActivity(draft, { action: c.state === "ok" ? "a validé" : "a fait avancer", target: c.k, ctx: "conformité", icon: "shield-01", tone: "brand" });
    return draft;
  },
  addDeadline: (title: string, date: string, kind: string, sub: string) => (draft: SgData): SgData => {
    draft.deadlines.push({ id: `d${Date.now()}`, date, title: title.trim(), sub, kind });
    draft.deadlines.sort((a, b) => a.date.localeCompare(b.date));
    pushActivity(draft, { action: "a ajouté une échéance", target: title, ctx: "calendrier réglementaire", icon: "calendar-add-01", tone: "info" });
    return draft;
  },
  deleteDeadline: (id: string) => (draft: SgData): SgData => {
    draft.deadlines = draft.deadlines.filter((d) => d.id !== id);
    return draft;
  },
};
