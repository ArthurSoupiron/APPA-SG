import { toast } from "sonner";

import type {
  DriveScanReport,
  RegistreDto,
  RegistreType,
  SheetPermissionEntry,
  SiRegistresInitialData,
  TraitementDataDto,
} from "./si-registres-types";

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
  const json = await parseJson<ApiResult & { message?: string; error?: string }>(res);
  if (!res.ok) {
    toast.error(json?.error ?? json?.message ?? "Erreur lors de l'opération.");
    return { success: false, error: json?.error };
  }
  return { success: true };
}

export async function fetchSiRegistresInitial(): Promise<SiRegistresInitialData | null> {
  const res = await fetch("/api/app/si/registres/initial", { credentials: "include" });
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  if (!res.ok) {
    toast.error("Impossible de charger les registres.");
    return null;
  }
  return parseJson<SiRegistresInitialData>(res);
}

export async function scanDriveImport(rootFolderId?: string): Promise<DriveScanReport | null> {
  const res = await fetch("/api/app/si/registres/drive/scan", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rootFolderId ? { rootFolderId } : {}),
  });
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  const json = await parseJson<DriveScanReport & { error?: string }>(res);
  if (!res.ok) {
    toast.error(json?.error ?? "Échec de l'import Drive.");
    return null;
  }
  return json;
}

export async function createRegistre(
  type: RegistreType,
  data: Record<string, unknown>,
): Promise<RegistreDto | null> {
  const res = await fetch(`/api/app/si/registres/${type}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!(await handleMutation(res)).success) return null;
  const json = await parseJson<{ registre: RegistreDto }>(res);
  return json?.registre ?? null;
}

export async function updateRegistre(
  type: RegistreType,
  id: string,
  data: Record<string, unknown>,
): Promise<RegistreDto | null> {
  const res = await fetch(`/api/app/si/registres/${type}/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!(await handleMutation(res)).success) return null;
  const json = await parseJson<{ registre: RegistreDto }>(res);
  return json?.registre ?? null;
}

export async function deleteRegistre(type: RegistreType, id: string): Promise<boolean> {
  const res = await fetch(`/api/app/si/registres/${type}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return (await handleMutation(res)).success;
}

export async function createTraitement(data: {
  nomTraitement: string;
  descriptionFinalite?: string;
}): Promise<TraitementDataDto | null> {
  const res = await fetch("/api/app/si/registres/traitements", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!(await handleMutation(res)).success) return null;
  const json = await parseJson<{ traitement: TraitementDataDto }>(res);
  return json?.traitement ?? null;
}

export async function updateTraitement(
  id: string,
  data: Record<string, unknown>,
): Promise<TraitementDataDto | null> {
  const res = await fetch(`/api/app/si/registres/traitements/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!(await handleMutation(res)).success) return null;
  const json = await parseJson<{ traitement: TraitementDataDto }>(res);
  return json?.traitement ?? null;
}

export async function deleteTraitement(id: string): Promise<boolean> {
  const res = await fetch(`/api/app/si/registres/traitements/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return (await handleMutation(res)).success;
}

export async function depositTraitementTemplate(
  id: string,
): Promise<{
  traitement: TraitementDataDto;
  templateFileUrl: string;
  templateSourceUrl: string;
} | null> {
  const res = await fetch(`/api/app/si/registres/traitements/${id}/deposit-template`, {
    method: "POST",
    credentials: "include",
  });
  const json = await parseJson<{
    traitement?: TraitementDataDto;
    templateFileUrl?: string;
    templateSourceUrl?: string;
    error?: string;
  }>(res);
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  if (!res.ok) {
    toast.error(json?.error ?? "Échec du dépôt du modèle.");
    return null;
  }
  if (!json?.traitement) return null;
  toast.success("Modèle déposé dans le dossier Drive.");
  return {
    traitement: json.traitement,
    templateFileUrl: json.templateFileUrl ?? "",
    templateSourceUrl: json.templateSourceUrl ?? "",
  };
}

export async function uploadTraitementPdf(
  id: string,
  file: File,
): Promise<TraitementDataDto | null> {
  const form = new FormData();
  form.append("files", file);
  const res = await fetch(`/api/app/si/registres/traitements/${id}/pdf`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!(await handleMutation(res)).success) return null;
  const json = await parseJson<{ traitement: TraitementDataDto }>(res);
  if (json?.traitement) toast.success("Fiche PDF importée dans le dossier Drive.");
  return json?.traitement ?? null;
}

export async function scanTraitementPreuves(id: string): Promise<TraitementDataDto | null> {
  const res = await fetch(`/api/app/si/registres/traitements/${id}/scan-preuves`, {
    method: "POST",
    credentials: "include",
  });
  if (!(await handleMutation(res)).success) return null;
  const json = await parseJson<{ traitement: TraitementDataDto }>(res);
  return json?.traitement ?? null;
}

export async function fetchSheetPermissions(url: string): Promise<SheetPermissionEntry[] | null> {
  const res = await fetch(
    `/api/app/si/registres/sheets/permissions?url=${encodeURIComponent(url)}`,
    { credentials: "include" },
  );
  if (!res.ok) return null;
  const json = await parseJson<{ permissions: SheetPermissionEntry[] }>(res);
  return json?.permissions ?? null;
}
