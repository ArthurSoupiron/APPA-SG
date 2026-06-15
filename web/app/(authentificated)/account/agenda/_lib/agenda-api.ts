import { toast } from "sonner";

import type {
  AgendaEventDetail,
  AgendaEventListItem,
  AgendaEventTypeRow,
  AgendaNotification,
  AgendaPole,
  AgendaWorkspaceGroupOption,
} from "./agenda-types";

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchAgendaEvents(params: {
  from?: string;
  to?: string;
  pole?: AgendaPole;
  status?: string;
  q?: string;
}): Promise<AgendaEventListItem[]> {
  const sp = new URLSearchParams();
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.pole) sp.set("pole", params.pole);
  if (params.status) sp.set("status", params.status);
  if (params.q?.trim()) sp.set("q", params.q.trim());
  const url = sp.toString() ? `/api/app/agenda/events?${sp}` : "/api/app/agenda/events";
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 403) {
    toast.error("Permission refusée (agenda.read).");
    return [];
  }
  if (!res.ok) {
    toast.error("Impossible de charger les événements.");
    return [];
  }
  const json = await parseJson<{ events?: AgendaEventListItem[] }>(res);
  return json?.events ?? [];
}

export async function fetchAgendaEventDetail(id: string): Promise<AgendaEventDetail | null> {
  const res = await fetch(`/api/app/agenda/events/${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    toast.error("Impossible de charger l’événement.");
    return null;
  }
  return parseJson<AgendaEventDetail>(res);
}

/** Importe les RSVP depuis Google Calendar puis renvoie le détail à jour. */
export async function syncAgendaGoogleRsvp(id: string): Promise<AgendaEventDetail | null> {
  const res = await fetch(
    `/api/app/agenda/events/${encodeURIComponent(id)}/sync/google-rsvp`,
    { method: "POST", credentials: "include" },
  );
  const json = await parseJson<
    AgendaEventDetail & { googleRsvpPull?: { ok: boolean; message?: string } }
  >(res);
  if (!res.ok || !json) {
    toast.error(json?.googleRsvpPull?.message ?? "Sync Google RSVP impossible.");
    return null;
  }
  if (json.googleRsvpPull && !json.googleRsvpPull.ok) {
    toast.error(json.googleRsvpPull.message ?? "Sync Google RSVP incomplète.");
  }
  const { googleRsvpPull: _pull, ...detail } = json;
  return detail;
}

export async function createAgendaEvent(
  body: Record<string, unknown>,
): Promise<AgendaEventDetail | null> {
  const res = await fetch("/api/app/agenda/events", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await parseJson<AgendaEventDetail & { error?: string; message?: string }>(res);
  if (!res.ok) {
    const msg =
      json?.message ??
      (json?.error === "google_meet_failed"
        ? "Échec de la création Google Meet. Reconnectez Google avec l’accès Calendar."
        : "Création impossible.");
    toast.error(msg);
    return null;
  }
  toast.success("Événement créé.");
  return json;
}

export async function deleteAgendaEvent(id: string): Promise<boolean> {
  const res = await fetch(`/api/app/agenda/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const json = await parseJson<{ message?: string; need?: string }>(res);
    const msg =
      json?.message ??
      (json?.need ? `Permission requise : ${json.need}` : "Suppression impossible.");
    toast.error(msg);
    return false;
  }
  toast.success("Événement supprimé.");
  return true;
}

export async function patchAgendaEvent(
  id: string,
  body: Record<string, unknown>,
): Promise<AgendaEventDetail | null> {
  const res = await fetch(`/api/app/agenda/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    toast.error("Mise à jour impossible.");
    return null;
  }
  return parseJson<AgendaEventDetail>(res);
}

export async function postAgendaComment(
  id: string,
  body: string,
): Promise<AgendaEventDetail | null> {
  const res = await fetch(`/api/app/agenda/events/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    toast.error("Commentaire non enregistré.");
    return null;
  }
  return parseJson<AgendaEventDetail>(res);
}

export async function patchAgendaRsvp(
  eventId: string,
  participantId: string,
  rsvpStatus: string,
): Promise<AgendaEventDetail | null> {
  const res = await fetch(
    `/api/app/agenda/events/${encodeURIComponent(eventId)}/participants/${encodeURIComponent(participantId)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvpStatus }),
    },
  );
  if (!res.ok) {
    toast.error("RSVP non enregistré.");
    return null;
  }
  return parseJson<AgendaEventDetail>(res);
}

export async function fetchAgendaWorkspaceGroups(): Promise<AgendaWorkspaceGroupOption[]> {
  const res = await fetch("/api/app/agenda/workspace-groups", { credentials: "include" });
  if (!res.ok) return [];
  const json = await parseJson<{ groups?: AgendaWorkspaceGroupOption[] }>(res);
  return json?.groups ?? [];
}

export async function fetchAgendaTypes(pole?: AgendaPole): Promise<AgendaEventTypeRow[]> {
  const url = pole
    ? `/api/app/agenda/types?pole=${encodeURIComponent(pole)}`
    : "/api/app/agenda/types";
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return [];
  const json = await parseJson<{ types?: AgendaEventTypeRow[] }>(res);
  return json?.types ?? [];
}

export async function fetchAgendaNotifications(): Promise<AgendaNotification[]> {
  const res = await fetch("/api/app/agenda/events/notifications", { credentials: "include" });
  if (!res.ok) return [];
  const json = await parseJson<{ notifications?: AgendaNotification[] }>(res);
  return json?.notifications ?? [];
}

export async function markAgendaNotificationsRead(ids: string[]): Promise<void> {
  await fetch("/api/app/agenda/events/notifications/read", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

export async function configureAgendaGoogleSync(enabled: boolean): Promise<boolean> {
  const res = await fetch("/api/app/agenda/events/sync/google", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) {
    toast.error("Sync Google impossible.");
    return false;
  }
  toast.success(enabled ? "Sync Google activée." : "Sync Google désactivée.");
  return true;
}

export async function exportAgendaSheet(): Promise<boolean> {
  const res = await fetch("/api/app/agenda/events/export/sheet", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    toast.error("Export Sheet impossible.");
    return false;
  }
  toast.success("Export Sheet lancé.");
  return true;
}
