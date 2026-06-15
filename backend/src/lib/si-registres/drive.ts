import { Readable } from "node:stream";

import { google } from "googleapis";
import type { drive_v3 } from "googleapis";

import { getDriveWriteAuthForUser } from "../google-drive-user-auth";
import { driveFolderBrowseUrl, parseDriveFolderIdFromUrl } from "../si-drive";

export { driveFolderBrowseUrl };

const FOLDER_MIME = "application/vnd.google-apps.folder";

export const PREUVES_RGPD_FOLDER = "Preuves_RGPD";
export const PREUVE_CONSENTEMENT_FOLDER = "1_Consentement_personnes";
export const PREUVE_MENTIONS_FOLDER = "2_Mentions_information";

export function getRegistresDriveRootFolderId(override?: string): string | null {
  if (override?.trim()) return override.trim();
  const url = process.env.DRIVE_REGISTRES_FOLDER_URL?.trim();
  if (!url) return null;
  return parseDriveFolderIdFromUrl(url);
}

export function isRegistresDriveConfigured(): boolean {
  return getRegistresDriveRootFolderId() !== null;
}

async function getDriveApi(userId: string) {
  const authRes = await getDriveWriteAuthForUser(userId);
  if (!authRes.ok) return { ok: false as const, message: authRes.message };
  return { ok: true as const, api: google.drive({ version: "v3", auth: authRes.auth }) };
}

export async function findChildFolderByName(
  api: drive_v3.Drive,
  parentId: string,
  name: string,
): Promise<string | null> {
  const escaped = name.replace(/'/g, "\\'");
  const q = `'${parentId}' in parents and mimeType = '${FOLDER_MIME}' and name = '${escaped}' and trashed = false`;
  const res = await api.files.list({
    q,
    fields: "files(id)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files?.[0]?.id ?? null;
}

async function createFolder(api: drive_v3.Drive, parentId: string, name: string): Promise<string> {
  const res = await api.files.create({
    requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });
  const id = res.data.id;
  if (!id) throw new Error("drive_folder_create_failed");
  return id;
}

export async function ensureChildFolder(
  api: drive_v3.Drive,
  parentId: string,
  name: string,
): Promise<string> {
  const existing = await findChildFolderByName(api, parentId, name);
  if (existing) return existing;
  return createFolder(api, parentId, name);
}

export async function createRegistreDriveFolder(
  userId: string,
  type: "rgpd" | "licences",
  anneeCivile: number,
  nom: string,
): Promise<{ ok: true; folderUrl: string } | { ok: false; message: string }> {
  const rootId = getRegistresDriveRootFolderId();
  if (!rootId) {
    return { ok: false, message: "DRIVE_REGISTRES_FOLDER_URL n'est pas configuré." };
  }

  const driveRes = await getDriveApi(userId);
  if (!driveRes.ok) return { ok: false, message: driveRes.message };

  const subfolderName = type === "licences" ? "licence" : "rgpd";
  const folderName = `Registre_${type}_${anneeCivile}_${nom}`;

  try {
    const subfolderId = await ensureChildFolder(driveRes.api, rootId, subfolderName);
    const folderId = await createFolder(driveRes.api, subfolderId, folderName);
    return { ok: true, folderUrl: driveFolderBrowseUrl(folderId) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function createTraitementDriveFolder(
  userId: string,
  folderName: string,
): Promise<{ ok: true; folderUrl: string } | { ok: false; message: string }> {
  const rootId = getRegistresDriveRootFolderId();
  if (!rootId) {
    return { ok: false, message: "DRIVE_REGISTRES_FOLDER_URL n'est pas configuré." };
  }

  const driveRes = await getDriveApi(userId);
  if (!driveRes.ok) return { ok: false, message: driveRes.message };

  try {
    const folderId = await createFolder(driveRes.api, rootId, folderName);
    const preuvesId = await ensureChildFolder(driveRes.api, folderId, PREUVES_RGPD_FOLDER);
    await ensureChildFolder(driveRes.api, preuvesId, PREUVE_CONSENTEMENT_FOLDER);
    await ensureChildFolder(driveRes.api, preuvesId, PREUVE_MENTIONS_FOLDER);
    return { ok: true, folderUrl: driveFolderBrowseUrl(folderId) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function uploadFileToRegistreFolder(
  userId: string,
  folderUrl: string,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<
  | { ok: true; webViewLink: string | null; name: string }
  | { ok: false; message: string }
> {
  const folderId = parseDriveFolderIdFromUrl(folderUrl);
  if (!folderId) return { ok: false, message: "URL dossier Drive invalide." };

  const driveRes = await getDriveApi(userId);
  if (!driveRes.ok) return { ok: false, message: driveRes.message };

  try {
    const res = await driveRes.api.files.create({
      requestBody: { name: file.name, parents: [folderId] },
      media: {
        mimeType: file.mimeType || "application/octet-stream",
        body: Readable.from(file.buffer),
      },
      fields: "id, name, webViewLink",
      supportsAllDrives: true,
    });
    return {
      ok: true,
      webViewLink: res.data.webViewLink ?? null,
      name: res.data.name ?? file.name,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function listChildFolders(
  api: drive_v3.Drive,
  parentId: string,
): Promise<Array<{ id: string; name: string; webViewLink: string | null }>> {
  const q = `'${parentId}' in parents and mimeType = '${FOLDER_MIME}' and trashed = false`;
  const items: Array<{ id: string; name: string; webViewLink: string | null }> = [];
  let pageToken: string | undefined;

  do {
    const res = await api.files.list({
      q,
      fields: "nextPageToken, files(id, name, webViewLink)",
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const f of res.data.files ?? []) {
      if (f.id && f.name) {
        items.push({ id: f.id, name: f.name, webViewLink: f.webViewLink ?? null });
      }
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return items;
}

export async function listFilesInFolder(
  api: drive_v3.Drive,
  folderId: string,
): Promise<Array<{ id: string; name: string; webViewLink: string | null }>> {
  const q = `'${folderId}' in parents and mimeType != '${FOLDER_MIME}' and trashed = false`;
  const res = await api.files.list({
    q,
    fields: "files(id, name, webViewLink)",
    pageSize: 20,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return (res.data.files ?? [])
    .filter((f) => f.id && f.name)
    .map((f) => ({
      id: f.id!,
      name: f.name!,
      webViewLink: f.webViewLink ?? null,
    }));
}

export async function getDriveApiForUser(userId: string) {
  return getDriveApi(userId);
}

export function parseRegistreFolderName(
  name: string,
  expectedType: "rgpd" | "licences",
): { anneeCivile: number; nom: string } | null {
  const re = new RegExp(`^Registre_${expectedType}_(\\d{4})_(.+)$`);
  const m = name.match(re);
  if (!m?.[1] || !m[2]) return null;
  return { anneeCivile: Number(m[1]), nom: m[2] };
}
