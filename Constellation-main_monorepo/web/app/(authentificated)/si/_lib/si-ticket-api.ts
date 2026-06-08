import { toast } from "sonner";

import type {
  SiNotification,
  SiTicketDetail,
  SiTicketDetailResponse,
  SiTicketListItem,
} from "./si-ticket-types";

function showUploadWarnings(warnings?: string[]) {
  if (warnings?.length) {
    toast.warning(`Fichiers partiels : ${warnings.join(" · ")}`);
  }
}

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchGoogleIntegrationStatus(): Promise<{
  linked: boolean;
  driveRead: boolean;
  driveWrite: boolean;
  spreadsheets: boolean;
  gaps: string[];
} | null> {
  const res = await fetch("/api/app/google/integration-status", { credentials: "include" });
  if (!res.ok) return null;
  return parseJson(res);
}

export async function fetchSiTickets(params: {
  q?: string;
  status?: string;
  manage?: boolean;
}): Promise<SiTicketListItem[]> {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.status) sp.set("status", params.status);
  const base = params.manage ? "/api/app/si/tickets/manage" : "/api/app/si/tickets";
  const url = sp.toString() ? `${base}?${sp}` : base;
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return [];
  }
  if (!res.ok) {
    toast.error("Impossible de charger les tickets.");
    return [];
  }
  const json = await parseJson<{ tickets?: SiTicketListItem[] }>(res);
  return json?.tickets ?? [];
}

export async function fetchSiTicketDetail(id: string): Promise<SiTicketDetail | null> {
  const res = await fetch(`/api/app/si/tickets/${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    toast.error("Impossible de charger le ticket.");
    return null;
  }
  return parseJson<SiTicketDetail>(res);
}

export async function createSiTicket(form: FormData): Promise<SiTicketDetail | null> {
  const res = await fetch("/api/app/si/tickets", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const json = await parseJson<SiTicketDetailResponse & { error?: string; message?: string }>(res);
  if (!res.ok) {
    toast.error(json?.message ?? "Création impossible.");
    return null;
  }
  toast.success("Ticket créé.");
  showUploadWarnings(json?.uploadWarnings);
  if (json) {
    const { uploadWarnings: _w, ...detail } = json;
    return detail;
  }
  return null;
}

export async function patchSiTicket(
  id: string,
  body: Record<string, unknown>,
): Promise<SiTicketDetail | null> {
  const res = await fetch(`/api/app/si/tickets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await parseJson<SiTicketDetail>(res);
  if (!res.ok) {
    toast.error("Mise à jour impossible.");
    return null;
  }
  return json;
}

export async function postSiComment(id: string, body: string): Promise<SiTicketDetail | null> {
  const res = await fetch(`/api/app/si/tickets/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    toast.error("Commentaire non enregistré.");
    return null;
  }
  return parseJson<SiTicketDetail>(res);
}

export async function uploadSiAttachments(id: string, files: File[]): Promise<SiTicketDetail | null> {
  const form = new FormData();
  for (const f of files) form.append("files", f, f.name);
  const res = await fetch(`/api/app/si/tickets/${encodeURIComponent(id)}/attachments`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const json = await parseJson<SiTicketDetailResponse & { error?: string; message?: string }>(res);
  if (!res.ok) {
    toast.error(json?.message ?? "Échec de l’envoi des fichiers.");
    return null;
  }
  toast.success("Fichiers envoyés.");
  showUploadWarnings(json?.uploadWarnings);
  if (json) {
    const { uploadWarnings: _w, ...detail } = json;
    return detail;
  }
  return null;
}

export async function toggleSiWatcher(id: string, watch: boolean): Promise<boolean> {
  const res = await fetch(`/api/app/si/tickets/${encodeURIComponent(id)}/watchers`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ watch }),
  });
  return res.ok;
}

export async function fetchSiNotifications(): Promise<SiNotification[]> {
  const res = await fetch("/api/app/si/tickets/notifications", { credentials: "include" });
  if (!res.ok) return [];
  const json = await parseJson<{ notifications?: SiNotification[] }>(res);
  return json?.notifications ?? [];
}

export async function markSiNotificationsRead(ids: string[]): Promise<void> {
  await fetch("/api/app/si/tickets/notifications/read", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

export async function startSiSheetRecovery(): Promise<string | null> {
  const res = await fetch("/api/app/si/tickets/recovery/import", {
    method: "POST",
    credentials: "include",
  });
  const json = await parseJson<{ jobId?: string }>(res);
  if (!res.ok) {
    toast.error("Impossible de lancer le réimport.");
    return null;
  }
  toast.success("Réimport planifié.");
  return json?.jobId ?? null;
}

export async function startSiSheetExport(): Promise<string | null> {
  const res = await fetch("/api/app/si/tickets/recovery/export", {
    method: "POST",
    credentials: "include",
  });
  const json = await parseJson<{ jobId?: string; error?: string }>(res);
  if (!res.ok) {
    toast.error("Impossible de lancer l’export vers le Sheet.");
    return null;
  }
  toast.success("Export backup planifié (onglets tickets + history).");
  return json?.jobId ?? null;
}
