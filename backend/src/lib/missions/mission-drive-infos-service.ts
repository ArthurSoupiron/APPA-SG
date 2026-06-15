import { validateDriveFolderForMissionLink } from "./create-mission-integrations";
import {
  downloadDriveFileMediaBuffer,
  listFilesInFolder,
} from "./mission-drive-service";
import {
  MISSION_INFOS_TXT_CANONICAL_NAME,
  MISSION_INFOS_TXT_MAX_BYTES,
  parseMissionInfosTxt,
} from "./parse-mission-infos-txt";
import type {
  CreateCommercialClientInput,
  CreateCommercialEntrepriseInput,
} from "../../types/missions";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const TEXT_PLAIN = "text/plain";

export type MissionDriveCommercialInfosResult = {
  found: boolean;
  fileName?: string;
  webViewLink?: string;
  client?: CreateCommercialClientInput;
  entreprise?: CreateCommercialEntrepriseInput;
  warnings?: string[];
  error?: string;
};

function isTxtFile(file: { name: string; mimeType: string }): boolean {
  if (file.mimeType === FOLDER_MIME) return false;
  if (file.mimeType === TEXT_PLAIN) return true;
  return file.name.toLowerCase().endsWith(".txt");
}

export function pickMissionInfosTxtFile(
  files: Array<{ id: string; name: string; webViewLink: string; mimeType: string }>,
): { id: string; name: string; webViewLink: string } | null {
  const txtFiles = files.filter(isTxtFile);
  if (txtFiles.length === 0) return null;

  const canonical = txtFiles.find(
    (f) => f.name.toLowerCase() === MISSION_INFOS_TXT_CANONICAL_NAME.toLowerCase(),
  );
  const picked = canonical ?? txtFiles[0]!;
  return {
    id: picked.id,
    name: picked.name,
    webViewLink: picked.webViewLink,
  };
}

export async function loadMissionCommercialInfosFromDriveFolder(
  userId: string,
  folderId: string,
): Promise<MissionDriveCommercialInfosResult> {
  try {
    const validatedFolderId = await validateDriveFolderForMissionLink(userId, folderId);
    const files = await listFilesInFolder(userId, validatedFolderId);
    const txtFile = pickMissionInfosTxtFile(files);

    if (!txtFile) {
      return { found: false };
    }

    const buffer = await downloadDriveFileMediaBuffer(userId, txtFile.id);
    if (!buffer) {
      return {
        found: true,
        fileName: txtFile.name,
        webViewLink: txtFile.webViewLink,
        error: "Impossible de télécharger le fichier TXT depuis Drive.",
      };
    }

    if (buffer.byteLength > MISSION_INFOS_TXT_MAX_BYTES) {
      return {
        found: true,
        fileName: txtFile.name,
        webViewLink: txtFile.webViewLink,
        error: `Fichier trop volumineux (max ${MISSION_INFOS_TXT_MAX_BYTES} octets).`,
      };
    }

    const parsed = parseMissionInfosTxt(buffer.toString("utf-8"));
    if (!parsed.ok) {
      return {
        found: true,
        fileName: txtFile.name,
        webViewLink: txtFile.webViewLink,
        error: parsed.error,
        warnings: parsed.warnings,
      };
    }

    return {
      found: true,
      fileName: txtFile.name,
      webViewLink: txtFile.webViewLink,
      client: parsed.data.client,
      entreprise: parsed.data.entreprise,
      warnings: parsed.warnings.length > 0 ? parsed.warnings : undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de lire le dossier Drive.";
    return { found: false, error: message };
  }
}
