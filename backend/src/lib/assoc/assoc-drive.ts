import { Readable } from "node:stream";

import { google } from "googleapis";

import { getDriveAuthForUser, getDriveWriteAuthForUser } from "../google-drive-user-auth";
import { parseDriveFolderIdFromUrl } from "../si-drive";

const FOLDER_MIME = "application/vnd.google-apps.folder";

/** Dossier Drive racine de la Gestion Associative (variable d'env DRIVE_SG_PARENT_FOLDER_URL). */
export function getAssocParentFolderId(): string | null {
  const url = process.env.DRIVE_SG_PARENT_FOLDER_URL?.trim();
  if (!url) return null;
  return parseDriveFolderIdFromUrl(url);
}

export type AssocDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string | null;
  size: string | null;
};

export type AssocUploadResult =
  | { ok: true; driveFileId: string; name: string; mimeType: string; webViewLink: string | null }
  | { ok: false; message: string };

/** Téléverse un fichier dans le dossier Drive SG. */
export async function uploadAssocDocument(
  userId: string,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<AssocUploadResult> {
  const parentId = getAssocParentFolderId();
  if (!parentId) {
    return { ok: false, message: "DRIVE_SG_PARENT_FOLDER_URL n'est pas configuré." };
  }
  const authRes = await getDriveWriteAuthForUser(userId);
  if (!authRes.ok) return { ok: false, message: authRes.message };

  const api = google.drive({ version: "v3", auth: authRes.auth });
  try {
    const res = await api.files.create({
      requestBody: { name: file.name, parents: [parentId] },
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

/** Liste les fichiers (hors dossiers) du dossier Drive SG — pour l'import. */
export async function listAssocDriveFiles(
  userId: string,
): Promise<{ ok: true; files: AssocDriveFile[] } | { ok: false; message: string }> {
  const parentId = getAssocParentFolderId();
  if (!parentId) {
    return { ok: false, message: "DRIVE_SG_PARENT_FOLDER_URL n'est pas configuré." };
  }
  const authRes = await getDriveAuthForUser(userId);
  if (!authRes.ok) return { ok: false, message: authRes.message };

  const api = google.drive({ version: "v3", auth: authRes.auth });
  try {
    const res = await api.files.list({
      q: `'${parentId}' in parents and mimeType != '${FOLDER_MIME}' and trashed = false`,
      fields: "files(id, name, mimeType, webViewLink, size)",
      pageSize: 100,
      orderBy: "modifiedTime desc",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const files: AssocDriveFile[] = (res.data.files ?? []).map((f) => ({
      id: f.id ?? "",
      name: f.name ?? "fichier",
      mimeType: f.mimeType ?? "",
      webViewLink: f.webViewLink ?? null,
      size: f.size ?? null,
    }));
    return { ok: true, files };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
