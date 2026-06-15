import { toast } from "sonner";

import type {
  BcEditorData,
  CreateCommercialClientInput,
  CreateCommercialEntrepriseInput,
  CreateMissionInput,
  DocsMatrixHydrateSlice,
  GestionnaireMissionsPermissions,
  IntervenantOption,
  ListDriveMissionTemplatesResult,
  MissionDocsMatrix,
  MissionEventWithActor,
  MissionFormOptions,
  MissionCreateIntegrationOptions,
  MissionDriveCommercialInfosResult,
  MissionIntegrationState,
  MissionRow,
  MissionsKpi,
  PendingTemplateFile,
  SlackGroupOption,
  TemplateDocType,
  TemplateGenerationFormData,
  UpdateMissionInput,
} from "./missions-types";

const BASE = "/api/app/missions";

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

async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
  });
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  if (!res.ok) {
    toast.error("Impossible de charger les données missions.");
    return null;
  }
  return parseJson<T>(res);
}

export async function fetchMissionsList(limit = 50): Promise<MissionRow[]> {
  const data = await fetchJson<{ missions: MissionRow[] }>(`?limit=${limit}`);
  return data?.missions ?? [];
}

export async function fetchMissionsKpi(): Promise<MissionsKpi | null> {
  return fetchJson<MissionsKpi>("/kpi");
}

export async function fetchMissionFormOptions(): Promise<MissionFormOptions | null> {
  return fetchJson<MissionFormOptions>("/form-options");
}

export async function fetchCreateIntegrationOptions(): Promise<MissionCreateIntegrationOptions | null> {
  return fetchJson<MissionCreateIntegrationOptions>(
    "/create-integration-options",
  );
}

export async function fetchDriveFolderCommercialInfos(
  folderId: string,
): Promise<MissionDriveCommercialInfosResult | null> {
  const res = await fetch(
    `${BASE}/drive-folder/${encodeURIComponent(folderId)}/commercial-infos`,
    { credentials: "include" },
  );
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  const json = await parseJson<MissionDriveCommercialInfosResult>(res);
  if (!json) return null;
  if (!res.ok) {
    toast.error(
      json.error ?? "Impossible de lire le fichier infos du dossier Drive.",
    );
    return json;
  }
  return json;
}

export async function fetchMissionPermissions(): Promise<GestionnaireMissionsPermissions | null> {
  return fetchJson<GestionnaireMissionsPermissions>("/permissions/me");
}

export async function fetchSlackGroupOptions(): Promise<SlackGroupOption[]> {
  const data = await fetchJson<{ groups: SlackGroupOption[] }>(
    "/config/slack-groups",
  );
  return data?.groups ?? [];
}

export async function fetchIntervenantOptions(): Promise<IntervenantOption[]> {
  const data = await fetchJson<{ options: IntervenantOption[] }>(
    "/intervenants/options",
  );
  return data?.options ?? [];
}

export async function hydrateMissionsDocsMatrices(
  missionIds: string[],
): Promise<DocsMatrixHydrateSlice[]> {
  const data = await fetchJson<{ slices: DocsMatrixHydrateSlice[] }>(
    "/docs-matrix/hydrate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionIds }),
    },
  );
  return data?.slices ?? [];
}

export async function createMission(
  input: CreateMissionInput,
): Promise<{ id: string } | null> {
  const res = await fetch(BASE, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  if (!res.ok) {
    await handleMutation(res);
    return null;
  }
  return parseJson<{ id: string }>(res);
}

export async function updateMission(
  input: UpdateMissionInput,
): Promise<ApiResult> {
  const res = await fetch(`${BASE}/${encodeURIComponent(input.id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleMutation(res);
}

export async function createCommercialClient(
  input: CreateCommercialClientInput,
): Promise<{ id: string; label: string } | null> {
  const res = await fetch(`${BASE}/commercial/clients`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  if (!res.ok) {
    await handleMutation(res);
    return null;
  }
  return parseJson<{ id: string; label: string }>(res);
}

export async function createCommercialEntreprise(
  input: CreateCommercialEntrepriseInput,
): Promise<{ id: string; label: string } | null> {
  const res = await fetch(`${BASE}/commercial/entreprises`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  if (!res.ok) {
    await handleMutation(res);
    return null;
  }
  return parseJson<{ id: string; label: string }>(res);
}

export async function fetchWorkflowState(missionId: string) {
  return fetchJson<import("./missions-types").MissionWorkflowState>(
    `/${encodeURIComponent(missionId)}/workflow`,
  );
}

export async function fetchMissionDocsMatrix(
  missionId: string,
): Promise<MissionDocsMatrix | null> {
  return fetchJson<MissionDocsMatrix>(
    `/${encodeURIComponent(missionId)}/docs-matrix`,
  );
}

export async function fetchMissionEvents(
  missionId: string,
): Promise<MissionEventWithActor[]> {
  const data = await fetchJson<{ events: MissionEventWithActor[] }>(
    `/${encodeURIComponent(missionId)}/events`,
  );
  return data?.events ?? [];
}

export async function fetchBcEditorData(
  missionId: string,
  bcId: string,
): Promise<BcEditorData | null> {
  return fetchJson<BcEditorData>(
    `/${encodeURIComponent(missionId)}/bcs/${encodeURIComponent(bcId)}/editor`,
  );
}

export async function fetchMissionIntegrationState(
  missionId: string,
): Promise<MissionIntegrationState | null> {
  return fetchJson<MissionIntegrationState>(
    `/${encodeURIComponent(missionId)}/integrations`,
  );
}

export async function updateSlackGroupConfig(
  groupIds: string[],
): Promise<ApiResult> {
  const res = await fetch(`${BASE}/config/slack-groups`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupIds }),
  });
  return handleMutation(res);
}

export async function ensureMissionDriveLink(
  missionId: string,
): Promise<ApiResult> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(missionId)}/integrations/drive`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  return handleMutation(res);
}

export async function createMissionSlackChannel(
  missionId: string,
  groupId: string,
): Promise<ApiResult> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(missionId)}/integrations/slack/channel`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    },
  );
  return handleMutation(res);
}

export async function linkMissionSlackChannel(
  missionId: string,
  channelId: string,
): Promise<ApiResult> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(missionId)}/integrations/slack/channel`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId }),
    },
  );
  return handleMutation(res);
}

export async function debugSendMissionSlackMessage(
  missionId: string,
): Promise<ApiResult> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(missionId)}/integrations/slack/debug-message`,
    { method: "POST", credentials: "include" },
  );
  return handleMutation(res);
}

export async function debugSendMissionSlackGroupTagMessage(
  missionId: string,
  groupId: string,
): Promise<ApiResult> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(missionId)}/integrations/slack/debug-group-tag`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    },
  );
  return handleMutation(res);
}

export async function createBc(
  missionId: string,
  body: {
    bcNumber: string;
    designations?: Array<{
      titre: string;
      description?: string | null;
      nbJeh?: number | null;
      montantJeh?: string | null;
    }>;
    frais?: Array<{
      texte: string;
      montantHt?: string | null;
      tva?: string | null;
    }>;
  },
): Promise<ApiResult> {
  const res = await fetch(`${BASE}/${encodeURIComponent(missionId)}/bcs`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleMutation(res);
}

export async function updateBcStructure(
  missionId: string,
  bcId: string,
  body: {
    bcNumber: string;
    designations: Array<{
      id?: string;
      titre: string;
      description?: string | null;
      nbJeh?: number | null;
      montantJeh?: string | null;
    }>;
    frais: Array<{
      id?: string;
      texte: string;
      montantHt?: string | null;
      tva?: string | null;
    }>;
  },
): Promise<ApiResult> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(missionId)}/bcs/${encodeURIComponent(bcId)}/structure`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return handleMutation(res);
}

export async function assignDesignationIntervenant(
  missionId: string,
  bcId: string,
  designationId: string,
  intervenantId: string | null,
): Promise<ApiResult> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(missionId)}/bcs/${encodeURIComponent(bcId)}/designations/${encodeURIComponent(designationId)}/intervenant`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervenantId }),
    },
  );
  return handleMutation(res);
}

type DocCreateBody = Record<string, unknown>;

async function postDoc(
  missionId: string,
  bcId: string,
  segment: string,
  body: DocCreateBody,
): Promise<ApiResult> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(missionId)}/bcs/${encodeURIComponent(bcId)}/${segment}`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return handleMutation(res);
}

export const createFa = (
  missionId: string,
  bcId: string,
  body: DocCreateBody,
) => postDoc(missionId, bcId, "fa", body);
export const createFs = (
  missionId: string,
  bcId: string,
  body: DocCreateBody,
) => postDoc(missionId, bcId, "fs", body);
export const createRmi = (
  missionId: string,
  bcId: string,
  body: DocCreateBody,
) => postDoc(missionId, bcId, "rmi", body);
export const createRmiPerIntervenant = (
  missionId: string,
  bcId: string,
  rmiNumber: string,
) => postDoc(missionId, bcId, "rmi/per-intervenant", { rmiNumber });
export const createBv = (
  missionId: string,
  bcId: string,
  body: DocCreateBody,
) => postDoc(missionId, bcId, "bv", body);
export const createBvPerIntervenant = (
  missionId: string,
  bcId: string,
  bvNumber: string,
) => postDoc(missionId, bcId, "bv/per-intervenant", { bvNumber });
export const createPvrf = (
  missionId: string,
  bcId: string,
  body: DocCreateBody,
) => postDoc(missionId, bcId, "pvrf", body);
export const createQs = (
  missionId: string,
  bcId: string,
  body: DocCreateBody,
) => postDoc(missionId, bcId, "qs", body);

export async function fetchTemplateFormData(
  missionId: string,
  bcId: string | null,
  documentType: TemplateDocType,
): Promise<TemplateGenerationFormData | null> {
  const q = new URLSearchParams({ documentType });
  if (bcId) q.set("bcId", bcId);
  const res = await fetch(
    `${BASE}/${encodeURIComponent(missionId)}/templates/form-data?${q}`,
    { credentials: "include" },
  );
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return null;
  }
  if (!res.ok) {
    const json = await parseJson<{ error?: string }>(res);
    toast.error(
      json?.error ??
        "Impossible de charger les balises du template. Synchronisez les modèles Drive (Config Jaeger → Templates).",
    );
    return null;
  }
  return parseJson<TemplateGenerationFormData>(res);
}

export async function previewTemplateDryRun(body: {
  missionId: string;
  bcId: string | null;
  documentType: TemplateDocType;
  documentNumber: string;
  values: Record<string, string>;
  perTargetValues?: Record<string, Record<string, string>>;
  targetIntervenantId?: string | null;
}): Promise<{ docxBase64: string; targetLabel: string | null } | null> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(body.missionId)}/templates/preview`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const json = await parseJson<{ error?: string }>(res);
    toast.error(json?.error ?? "Prévisualisation impossible.");
    return null;
  }
  return parseJson<{ docxBase64: string; targetLabel: string | null }>(res);
}

export async function generateMissionTemplate(body: {
  missionId: string;
  bcId: string | null;
  documentType: TemplateDocType;
  documentNumber: string;
  values: Record<string, string>;
  perTargetValues?: Record<string, Record<string, string>>;
}): Promise<ApiResult> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(body.missionId)}/templates/generate`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return handleMutation(res);
}

export async function listPendingTemplateDocx(body: {
  missionId: string;
  bcId: string | null;
  documentType: TemplateDocType;
}): Promise<PendingTemplateFile[]> {
  const q = new URLSearchParams({ documentType: body.documentType });
  if (body.bcId) q.set("bcId", body.bcId);
  return (
    (await fetchJson<PendingTemplateFile[]>(
      `/${encodeURIComponent(body.missionId)}/templates/pending-docx?${q}`,
    )) ?? []
  );
}

/** @deprecated Utiliser listPendingTemplateDocx */
export const listPendingTemplateHtml = listPendingTemplateDocx;

export async function validateTemplateDocx(body: {
  missionId: string;
  bcId: string | null;
  documentType: TemplateDocType;
  docxFileId: string;
  outputBaseName?: string;
}): Promise<ApiResult> {
  const res = await fetch(
    `${BASE}/${encodeURIComponent(body.missionId)}/templates/validate`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return handleMutation(res);
}

/** @deprecated Utiliser validateTemplateDocx */
export async function validateTemplateHtml(body: {
  missionId: string;
  bcId: string | null;
  documentType: TemplateDocType;
  htmlFileId: string;
  outputBaseName?: string;
}): Promise<ApiResult> {
  return validateTemplateDocx({ ...body, docxFileId: body.htmlFileId });
}

export async function syncMissionTemplates(): Promise<ListDriveMissionTemplatesResult | null> {
  const res = await fetch(`${BASE}/templates/sync`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    await handleMutation(res);
    return { ok: false, error: "sync_failed", items: [] };
  }
  return parseJson<ListDriveMissionTemplatesResult>(res);
}
