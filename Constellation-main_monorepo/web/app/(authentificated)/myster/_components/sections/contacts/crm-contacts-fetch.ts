import { toast } from "sonner";

import type { Prospect, ProspectTimelineEntry } from "./crm-contacts-types";

export async function fetchCrmProspectsPage(params: {
  page: number;
  q: string;
  statutFilter: string;
}): Promise<{ prospects: Prospect[]; total: number } | null> {
  const { page, q, statutFilter } = params;
  const sp = new URLSearchParams({
    page: String(page),
    pageSize: "50",
  });
  if (q.trim()) sp.set("q", q.trim());
  if (statutFilter) sp.set("statut", statutFilter);
  const res = await fetch(`/api/app/crm/prospects?${sp}`, {
    credentials: "include",
  });
  if (res.status === 403) {
    toast.error("Permission refusée (crm.read).");
    return null;
  }
  if (!res.ok) {
    toast.error("Impossible de charger les prospects.");
    return null;
  }
  const json: { prospects?: Prospect[]; total?: number } = await res.json();
  return { prospects: json.prospects ?? [], total: json.total ?? 0 };
}

export async function fetchCrmProspectDetail(id: string): Promise<{
  prospect: Prospect | null;
  timeline: ProspectTimelineEntry[];
} | null> {
  const res = await fetch(`/api/app/crm/prospects/${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  if (res.status === 403) {
    toast.error("Permission refusée (crm.read).");
    return null;
  }
  if (!res.ok) {
    toast.error("Détail prospect indisponible.");
    return null;
  }
  const json: { prospect?: Prospect; timeline?: ProspectTimelineEntry[] } = await res.json();
  return { prospect: json.prospect ?? null, timeline: json.timeline ?? [] };
}
