import { toast } from "sonner";

import type {
  ActionPlanCampus,
  ActionPlanPole,
  ActionPlanStatus,
  ActionPlanTreeResponse,
} from "./action-plan-types";

type ApiResult = { success: boolean; error?: string };

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function handleMutation(res: Response): Promise<ApiResult> {
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return { success: false, error: "forbidden" };
  }
  const json = await parseJson<ApiResult & { message?: string }>(res);
  if (!res.ok) {
    toast.error(json?.error ?? json?.message ?? "Erreur lors de l'opération.");
    return { success: false, error: json?.error };
  }
  return { success: true };
}

export async function fetchActionPlanTree(): Promise<ActionPlanTreeResponse | null> {
  const res = await fetch("/api/app/action-plan/tree", { credentials: "include" });
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  if (!res.ok) {
    toast.error("Impossible de charger le plan d'action.");
    return null;
  }
  return parseJson<ActionPlanTreeResponse>(res);
}

export async function createAxis(data: {
  title: string;
  description?: string;
  sortOrder?: number;
}): Promise<ApiResult> {
  const res = await fetch("/api/app/action-plan/axes", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleMutation(res);
}

export async function updateAxis(
  id: string,
  data: { title?: string; description?: string; sortOrder?: number },
): Promise<ApiResult> {
  const res = await fetch(`/api/app/action-plan/axes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleMutation(res);
}

export async function deleteAxis(id: string): Promise<ApiResult> {
  const res = await fetch(`/api/app/action-plan/axes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleMutation(res);
}

export async function createSubAxis(data: {
  axisId: string;
  title: string;
  description?: string;
  sortOrder?: number;
}): Promise<ApiResult> {
  const res = await fetch("/api/app/action-plan/sub-axes", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleMutation(res);
}

export async function updateSubAxis(
  id: string,
  data: { title?: string; description?: string; sortOrder?: number },
): Promise<ApiResult> {
  const res = await fetch(`/api/app/action-plan/sub-axes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleMutation(res);
}

export async function deleteSubAxis(id: string): Promise<ApiResult> {
  const res = await fetch(`/api/app/action-plan/sub-axes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleMutation(res);
}

export async function createSmart(data: {
  subAxisId: string;
  title: string;
  description?: string;
  sortOrder?: number;
}): Promise<ApiResult> {
  const res = await fetch("/api/app/action-plan/smarts", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleMutation(res);
}

export async function updateSmart(
  id: string,
  data: { title?: string; description?: string; sortOrder?: number },
): Promise<ApiResult> {
  const res = await fetch(`/api/app/action-plan/smarts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleMutation(res);
}

export async function deleteSmart(id: string): Promise<ApiResult> {
  const res = await fetch(`/api/app/action-plan/smarts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleMutation(res);
}

export async function createAction(data: {
  smartId: string;
  title: string;
  description?: string;
  owner?: string;
  status?: ActionPlanStatus;
  progress?: number;
  priority?: number;
  sortOrder?: number;
  startDate?: string | null;
  dueDate?: string | null;
  campus?: ActionPlanCampus | null;
  poles?: ActionPlanPole[];
}): Promise<ApiResult> {
  const res = await fetch("/api/app/action-plan/actions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleMutation(res);
}

export async function updateAction(
  id: string,
  data: {
    title?: string;
    description?: string;
    owner?: string;
    status?: ActionPlanStatus;
    progress?: number;
    priority?: number;
    sortOrder?: number;
    startDate?: string | null;
    dueDate?: string | null;
    campus?: ActionPlanCampus | null;
    poles?: ActionPlanPole[];
  },
): Promise<ApiResult> {
  const res = await fetch(`/api/app/action-plan/actions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleMutation(res);
}

export async function deleteAction(id: string): Promise<ApiResult> {
  const res = await fetch(`/api/app/action-plan/actions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleMutation(res);
}

export async function createSubAction(data: {
  actionId: string;
  title: string;
  description?: string;
  owner?: string;
  status?: ActionPlanStatus;
  progress?: number;
  priority?: number;
  sortOrder?: number;
  startDate?: string | null;
  dueDate?: string | null;
  campus?: ActionPlanCampus | null;
  poles?: ActionPlanPole[];
}): Promise<ApiResult> {
  const res = await fetch("/api/app/action-plan/sub-actions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleMutation(res);
}

export async function updateSubAction(
  id: string,
  data: {
    title?: string;
    description?: string;
    owner?: string;
    status?: ActionPlanStatus;
    progress?: number;
    priority?: number;
    sortOrder?: number;
    startDate?: string | null;
    dueDate?: string | null;
    campus?: ActionPlanCampus | null;
    poles?: ActionPlanPole[];
  },
): Promise<ApiResult> {
  const res = await fetch(`/api/app/action-plan/sub-actions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleMutation(res);
}

export async function deleteSubAction(id: string): Promise<ApiResult> {
  const res = await fetch(`/api/app/action-plan/sub-actions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleMutation(res);
}

export async function exportActionPlan(): Promise<ActionPlanTreeResponse | null> {
  const res = await fetch("/api/app/action-plan/export", { credentials: "include" });
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  if (!res.ok) {
    toast.error("Impossible d'exporter le plan d'action.");
    return null;
  }
  const json = await parseJson<ActionPlanTreeResponse & { exportedAt?: string }>(res);
  if (!json) return null;
  return { tree: json.tree, globalProgress: json.globalProgress };
}

export async function importActionPlan(tree: unknown): Promise<ActionPlanTreeResponse | null> {
  const res = await fetch("/api/app/action-plan/import", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tree }),
  });
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  const json = await parseJson<ActionPlanTreeResponse & ApiResult>(res);
  if (!res.ok || !json?.success) {
    toast.error(json?.error ?? "Erreur lors de l'import.");
    return null;
  }
  return { tree: json.tree, globalProgress: json.globalProgress };
}
