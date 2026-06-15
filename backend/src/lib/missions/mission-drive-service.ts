import { Readable } from "node:stream";
import { google } from "googleapis";
import type { drive_v3 } from "googleapis";

import { getDriveWriteAuthForUser } from "../google-drive-user-auth";

export function extractFolderIdFromUrl(url: string): string | null {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

function sanitizeDriveFolderName(name: string, fallback: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, "-").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 200) : fallback;
}

async function getDriveClient(userId: string) {
  const authRes = await getDriveWriteAuthForUser(userId);
  if (!authRes.ok) throw new Error(authRes.message);
  return google.drive({ version: "v3", auth: authRes.auth });
}

async function getFolderInfo(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<{ exists: boolean; driveId?: string }> {
  try {
    const response = await drive.files.get({
      fileId: folderId,
      fields: "id, name, driveId",
      supportsAllDrives: true,
    });
    return { exists: true, driveId: response.data.driveId || undefined };
  } catch {
    return { exists: false };
  }
}

export async function getDriveFileMetadata(
  userId: string,
  fileId: string,
): Promise<{ exists: boolean; trashed: boolean; mimeType: string | null }> {
  try {
    const drive = await getDriveClient(userId);
    const response = await drive.files.get({
      fileId,
      fields: "id, trashed, mimeType",
      supportsAllDrives: true,
    });
    return {
      exists: Boolean(response.data.id),
      trashed: Boolean(response.data.trashed),
      mimeType: response.data.mimeType ?? null,
    };
  } catch {
    return { exists: false, trashed: false, mimeType: null };
  }
}

export async function listFilesInFolder(
  userId: string,
  folderId: string,
): Promise<Array<{ id: string; name: string; webViewLink: string; mimeType: string }>> {
  try {
    const drive = await getDriveClient(userId);
    const folderInfo = await getFolderInfo(drive, folderId);
    const driveId = folderInfo.driveId;
    const allFiles: Array<{ id: string; name: string; webViewLink: string; mimeType: string }> =
      [];
    let pageToken: string | undefined;
    while (true) {
      const queryOptions: drive_v3.Params$Resource$Files$List = {
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, webViewLink, mimeType)",
        pageSize: 100,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      };
      if (pageToken) queryOptions.pageToken = pageToken;
      if (driveId) {
        queryOptions.driveId = driveId;
        queryOptions.corpora = "drive";
      }
      const response = await drive.files.list(queryOptions);
      for (const file of response.data.files ?? []) {
        if (file.id && file.name) {
          allFiles.push({
            id: file.id,
            name: file.name,
            webViewLink:
              file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
            mimeType: file.mimeType || "",
          });
        }
      }
      pageToken = response.data.nextPageToken || undefined;
      if (!pageToken) break;
    }
    return allFiles;
  } catch (error) {
    console.error(`Erreur listFilesInFolder ${folderId}:`, error);
    return [];
  }
}

export async function createDriveFolderInParent(
  userId: string,
  parentFolderId: string,
  folderName: string,
): Promise<{ id: string; webViewLink: string } | null> {
  try {
    const drive = await getDriveClient(userId);
    const folderInfo = await getFolderInfo(drive, parentFolderId);
    if (!folderInfo.exists) return null;
    const requestBody = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    };
    const createOptions = {
      requestBody,
      fields: "id, webViewLink",
      supportsAllDrives: true,
      ...(folderInfo.driveId ? { driveId: folderInfo.driveId } : {}),
    };
    const response = await drive.files.create(createOptions);
    if (response.data.id && response.data.webViewLink) {
      return { id: response.data.id, webViewLink: response.data.webViewLink };
    }
    return null;
  } catch (error) {
    console.error("Erreur createDriveFolderInParent:", error);
    return null;
  }
}

export async function uploadFileToDriveWithId(
  userId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string,
): Promise<{ id: string; webViewLink: string } | null> {
  try {
    const drive = await getDriveClient(userId);
    const folderInfo = await getFolderInfo(drive, folderId);
    const stream = Readable.from(fileBuffer);
    const uploadOptions = {
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType, body: stream },
      fields: "id, webViewLink",
      supportsAllDrives: true,
      ...(folderInfo.driveId ? { driveId: folderInfo.driveId } : {}),
    };
    const response = await drive.files.create(uploadOptions);
    if (response.data.id && response.data.webViewLink) {
      return { id: response.data.id, webViewLink: response.data.webViewLink };
    }
    return null;
  } catch (error) {
    console.error("Erreur uploadFileToDriveWithId:", error);
    return null;
  }
}

export async function downloadDriveFileMediaBuffer(
  userId: string,
  fileId: string,
): Promise<Buffer | null> {
  try {
    const drive = await getDriveClient(userId);
    const downloadRes = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" },
    );
    return Buffer.from(downloadRes.data as ArrayBuffer);
  } catch (error) {
    console.error("Erreur downloadDriveFileMediaBuffer:", error);
    return null;
  }
}

export async function deleteDriveFile(userId: string, fileId: string): Promise<boolean> {
  try {
    const drive = await getDriveClient(userId);
    await drive.files.delete({ fileId, supportsAllDrives: true });
    return true;
  } catch (error) {
    console.error("Erreur deleteDriveFile:", error);
    return false;
  }
}

export async function renameDriveFile(
  userId: string,
  fileId: string,
  newName: string,
): Promise<boolean> {
  try {
    const drive = await getDriveClient(userId);
    await drive.files.update({
      fileId,
      requestBody: { name: newName },
      supportsAllDrives: true,
    });
    return true;
  } catch (error) {
    console.error("Erreur renameDriveFile:", error);
    return false;
  }
}

export const DRIVE_MISSIONS_ROOT_ID =
  process.env.DRIVE_MISSIONS_ROOT_ID ?? "17jSWF2Pugj0HhBHkQFuHnnUEMCnvXRvR";

export const MISSION_DRIVE_SUBFOLDER_TEMPLATE = "Template";
export const MISSION_DRIVE_SUBFOLDER_CDC = "CDC";
export const MISSION_DRIVE_SUBFOLDER_PROPALE = "Propale";

const FOLDER_MIME = "application/vnd.google-apps.folder";

export type MissionDriveFolderOption = {
  id: string;
  name: string;
  year: string;
  label: string;
  webViewLink: string;
  linkedMissionName: string | null;
};

/** Dossiers mission sous racine Drive → année → mission (hors Template). */
export async function listMissionDriveFoldersFromRoot(
  userId: string,
  linkedByFolderId: Map<string, string> = new Map(),
): Promise<{ folders: MissionDriveFolderOption[]; error?: string }> {
  try {
    const authRes = await getDriveWriteAuthForUser(userId);
    if (!authRes.ok) {
      return { folders: [], error: authRes.message };
    }

    const rootMeta = await getDriveFileMetadata(userId, DRIVE_MISSIONS_ROOT_ID);
    if (!rootMeta.exists) {
      return { folders: [], error: "Racine Drive missions introuvable ou inaccessible." };
    }

    const rootChildren = await listFilesInFolder(userId, DRIVE_MISSIONS_ROOT_ID);
    const yearFolders = rootChildren.filter(
      (f) =>
        f.mimeType === FOLDER_MIME &&
        f.name !== MISSION_DRIVE_SUBFOLDER_TEMPLATE &&
        /^\d{4}$/.test(f.name),
    );

    const folders: MissionDriveFolderOption[] = [];
    await Promise.all(
      yearFolders.map(async (yearFolder) => {
        const missionChildren = await listFilesInFolder(userId, yearFolder.id);
        for (const missionFolder of missionChildren) {
          if (missionFolder.mimeType !== FOLDER_MIME) continue;
          folders.push({
            id: missionFolder.id,
            name: missionFolder.name,
            year: yearFolder.name,
            label: `${yearFolder.name} / ${missionFolder.name}`,
            webViewLink:
              missionFolder.webViewLink ||
              `https://drive.google.com/drive/folders/${missionFolder.id}`,
            linkedMissionName: linkedByFolderId.get(missionFolder.id) ?? null,
          });
        }
      }),
    );

    folders.sort(
      (a, b) => b.year.localeCompare(a.year) || a.name.localeCompare(b.name, "fr"),
    );
    return { folders };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de scanner le Drive missions.";
    return { folders: [], error: message };
  }
}

const pendingGetOrCreateSubfolder = new Map<string, Promise<string | null>>();

export async function ensureMissionStandardSubfolders(
  userId: string,
  missionFolderId: string,
): Promise<void> {
  await getOrCreateSubfolder(userId, missionFolderId, MISSION_DRIVE_SUBFOLDER_PROPALE);
  await getOrCreateSubfolder(userId, missionFolderId, MISSION_DRIVE_SUBFOLDER_CDC);
}

export function getOrCreateSubfolder(
  userId: string,
  parentFolderId: string,
  folderName: string,
): Promise<string | null> {
  const dedupeKey = `${userId}\0${parentFolderId}\0${folderName}`;
  const inflight = pendingGetOrCreateSubfolder.get(dedupeKey);
  if (inflight) return inflight;
  const promise = (async (): Promise<string | null> => {
    try {
      const files = await listFilesInFolder(userId, parentFolderId);
      const folder = files.find(
        (f) =>
          f.mimeType === "application/vnd.google-apps.folder" && f.name === folderName,
      );
      if (folder) return folder.id;
      const created = await createDriveFolderInParent(userId, parentFolderId, folderName);
      return created?.id ?? null;
    } finally {
      pendingGetOrCreateSubfolder.delete(dedupeKey);
    }
  })();
  pendingGetOrCreateSubfolder.set(dedupeKey, promise);
  return promise;
}

export async function getOrCreateMissionDriveFolder(
  userId: string,
  missionName: string,
  year: number,
  existingFolderId?: string | null,
): Promise<{ folderId: string; folderUrl: string } | null> {
  if (existingFolderId) {
    return {
      folderId: existingFolderId,
      folderUrl: `https://drive.google.com/drive/folders/${existingFolderId}`,
    };
  }
  const yearId = await getOrCreateSubfolder(userId, DRIVE_MISSIONS_ROOT_ID, String(year));
  if (!yearId) return null;
  const safeName = sanitizeDriveFolderName(missionName, `Mission-${year}`);
  const missionFolderId = await getOrCreateSubfolder(userId, yearId, safeName);
  if (!missionFolderId) return null;
  return {
    folderId: missionFolderId,
    folderUrl: `https://drive.google.com/drive/folders/${missionFolderId}`,
  };
}

export async function getDriveFileState(
  userId: string,
  fileId: string,
): Promise<{ exists: boolean; trashed: boolean }> {
  const m = await getDriveFileMetadata(userId, fileId);
  return { exists: m.exists, trashed: m.trashed };
}

export async function restoreDriveFileFromTrash(
  userId: string,
  fileId: string,
): Promise<boolean> {
  try {
    const drive = await getDriveClient(userId);
    await drive.files.update({
      fileId,
      requestBody: { trashed: false },
      supportsAllDrives: true,
    });
    return true;
  } catch {
    return false;
  }
}

const DOCX_EXPORT_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function exportGoogleDocAsDocxBuffer(
  userId: string,
  fileId: string,
): Promise<Buffer | null> {
  try {
    const drive = await getDriveClient(userId);
    const exportRes = await drive.files.export(
      { fileId, mimeType: DOCX_EXPORT_MIME },
      { responseType: "arraybuffer" },
    );
    return Buffer.from(exportRes.data as ArrayBuffer);
  } catch (error) {
    console.error("Erreur exportGoogleDocAsDocxBuffer:", error);
    return null;
  }
}

export async function convertDocxBufferToPdfBuffer(
  userId: string,
  docxBuffer: Buffer,
  tempBaseName: string,
): Promise<Buffer | null> {
  let importedGoogleDocId: string | null = null;
  try {
    const drive = await getDriveClient(userId);
    const docxStream = Readable.from(docxBuffer);
    const importRes = await drive.files.create({
      requestBody: {
        name: `${tempBaseName}.docx`,
        mimeType: "application/vnd.google-apps.document",
      },
      media: {
        mimeType: DOCX_EXPORT_MIME,
        body: docxStream,
      },
      fields: "id",
      supportsAllDrives: true,
    });
    importedGoogleDocId = importRes.data.id ?? null;
    if (!importedGoogleDocId) return null;
    const exportRes = await drive.files.export(
      { fileId: importedGoogleDocId, mimeType: "application/pdf" },
      { responseType: "arraybuffer" },
    );
    const pdfData = exportRes.data;
    if (!pdfData) return null;
    return Buffer.from(pdfData as ArrayBuffer);
  } catch (error) {
    console.error("Erreur conversion DOCX->PDF via Drive:", error);
    return null;
  } finally {
    if (importedGoogleDocId) {
      try {
        const drive = await getDriveClient(userId);
        await drive.files.delete({
          fileId: importedGoogleDocId,
          supportsAllDrives: true,
        });
      } catch {
        // best effort cleanup
      }
    }
  }
}

export async function convertDriveDocxToPdfAndDelete(
  userId: string,
  sourceDocxFileId: string,
  targetFolderId: string,
  outputPdfFileName: string,
): Promise<{ id: string; webViewLink: string } | null> {
  try {
    const docxBuffer = await downloadDriveFileMediaBuffer(userId, sourceDocxFileId);
    if (!docxBuffer) return null;
    const pdfBuffer = await convertDocxBufferToPdfBuffer(
      userId,
      docxBuffer,
      outputPdfFileName.replace(/\.pdf$/i, ""),
    );
    if (!pdfBuffer) return null;
    const uploaded = await uploadFileToDriveWithId(
      userId,
      pdfBuffer,
      outputPdfFileName,
      "application/pdf",
      targetFolderId,
    );
    if (!uploaded) return null;
    await deleteDriveFile(userId, sourceDocxFileId);
    return uploaded;
  } catch (error) {
    console.error("Erreur validation DOCX->PDF:", error);
    return null;
  }
}
