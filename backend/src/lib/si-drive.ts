import { Readable } from "node:stream";

import { google } from "googleapis";
import type { drive_v3 } from "googleapis";

import { getDriveWriteAuthForUser } from "./google-drive-user-auth";

const FOLDER_MIME = "application/vnd.google-apps.folder";

export function parseDriveFolderIdFromUrl(url: string): string | null {
  const trimmed = url.trim();
  const m = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m?.[1] ?? null;
}

export function getSiDriveParentFolderId(): string | null {
  const url = process.env.DRIVE_SI_PARENT_FOLDER_URL?.trim();
  if (!url) return null;
  return parseDriveFolderIdFromUrl(url);
}

export function slugifyTicketFolderName(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (base || "ticket").slice(0, 60);
}

export function driveFolderBrowseUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`;
}

async function findChildFolderByName(
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

async function createFolder(
  api: drive_v3.Drive,
  parentId: string,
  name: string,
): Promise<string> {
  const res = await api.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });
  const id = res.data.id;
  if (!id) throw new Error("drive_folder_create_failed");
  return id;
}

async function ensureChildFolder(
  api: drive_v3.Drive,
  parentId: string,
  name: string,
): Promise<string> {
  const existing = await findChildFolderByName(api, parentId, name);
  if (existing) return existing;
  return createFolder(api, parentId, name);
}

export type SiTicketDriveFolder = {
  folderId: string;
  folderUrl: string;
};

/**
 * Crée ou retrouve `/{YYYY}/{MM}/{reference}-{slug}/` sous la racine SI.
 */
export async function ensureSiTicketFolderPath(
  userId: string,
  reference: string,
  title: string,
  createdAt: Date,
): Promise<
  { ok: true; folder: SiTicketDriveFolder } | { ok: false; message: string; code?: string }
> {
  const parentId = getSiDriveParentFolderId();
  if (!parentId) {
    return {
      ok: false,
      code: "drive_config",
      message: "DRIVE_SI_PARENT_FOLDER_URL n’est pas configuré.",
    };
  }

  const authRes = await getDriveWriteAuthForUser(userId);
  if (!authRes.ok) {
    return { ok: false, code: "drive_auth", message: authRes.message };
  }

  const api = google.drive({ version: "v3", auth: authRes.auth });
  const year = String(createdAt.getFullYear());
  const month = String(createdAt.getMonth() + 1).padStart(2, "0");
  const slug = slugifyTicketFolderName(title);
  const leafName = `${reference}-${slug}`;

  try {
    const yearId = await ensureChildFolder(api, parentId, year);
    const monthId = await ensureChildFolder(api, yearId, month);
    const existingLeaf = await findChildFolderByName(api, monthId, leafName);
    const folderId = existingLeaf ?? (await createFolder(api, monthId, leafName));
    return {
      ok: true,
      folder: { folderId, folderUrl: driveFolderBrowseUrl(folderId) },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, code: "drive_api", message };
  }
}

export async function uploadFileToSiTicketFolder(
  userId: string,
  folderId: string,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<
  | {
      ok: true;
      driveFileId: string;
      name: string;
      mimeType: string;
      webViewLink: string | null;
    }
  | { ok: false; message: string }
> {
  const authRes = await getDriveWriteAuthForUser(userId);
  if (!authRes.ok) return { ok: false, message: authRes.message };

  const api = google.drive({ version: "v3", auth: authRes.auth });
  try {
    const res = await api.files.create({
      requestBody: { name: file.name, parents: [folderId] },
      media: {
        mimeType: file.mimeType || "application/octet-stream",
        body: Readable.from(file.buffer),
      },
      fields: "id, name, mimeType, webViewLink",
      supportsAllDrives: true,
    });
    const id = res.data.id;
    if (!id) return { ok: false, message: "drive_upload_failed" };
    return {
      ok: true,
      driveFileId: id,
      name: res.data.name ?? file.name,
      mimeType: res.data.mimeType ?? file.mimeType,
      webViewLink: res.data.webViewLink ?? null,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
