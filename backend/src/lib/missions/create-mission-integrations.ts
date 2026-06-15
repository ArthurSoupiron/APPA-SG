import { and, eq, ne } from "drizzle-orm";

import { db } from "../../db";
import { missionCca } from "../../db/schema";
import {
  ensureMissionStandardSubfolders,
  extractFolderIdFromUrl,
  getDriveFileMetadata,
  restoreDriveFileFromTrash,
} from "./mission-drive-service";
import { getSlackChannelStateCore } from "./mission-slack-service";

const FOLDER_MIME = "application/vnd.google-apps.folder";

export function parseDriveFolderInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const fromUrl = extractFolderIdFromUrl(trimmed);
  if (fromUrl) return fromUrl;
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  return null;
}

export async function validateDriveFolderForMissionLink(
  userId: string,
  raw: string,
): Promise<string> {
  const folderId = parseDriveFolderInput(raw);
  if (!folderId) {
    throw new Error("URL ou identifiant de dossier Drive invalide.");
  }
  const meta = await getDriveFileMetadata(userId, folderId);
  if (!meta.exists) throw new Error("Dossier Drive introuvable ou inaccessible.");
  if (meta.mimeType !== FOLDER_MIME) {
    throw new Error("L'identifiant fourni ne correspond pas à un dossier Drive.");
  }
  if (meta.trashed) {
    const restored = await restoreDriveFileFromTrash(userId, folderId);
    if (!restored) throw new Error("Dossier Drive en corbeille — restauration impossible.");
  }
  return folderId;
}

export async function validateSlackChannelForMissionLink(channelId: string): Promise<string> {
  const trimmed = channelId.trim();
  if (!trimmed) throw new Error("Canal Slack invalide.");
  const state = await getSlackChannelStateCore(trimmed);
  if (!state.success) {
    throw new Error(state.error ?? "Impossible de vérifier le canal Slack.");
  }
  if (!state.exists) throw new Error("Canal Slack introuvable.");
  return trimmed;
}

/** Détache Drive / Slack des autres missions (recréation sur ressources existantes). */
export async function detachIntegrationsFromOtherMissions(input: {
  driveFolderId?: string | null;
  slackChannelId?: string | null;
  keepMissionId: string;
}): Promise<void> {
  const now = new Date();
  if (input.driveFolderId) {
    await db
      .update(missionCca)
      .set({ driveFolderId: null, updatedAt: now })
      .where(
        and(
          eq(missionCca.driveFolderId, input.driveFolderId),
          ne(missionCca.id, input.keepMissionId),
        ),
      );
  }
  if (input.slackChannelId) {
    await db
      .update(missionCca)
      .set({ slackChannelId: null, updatedAt: now })
      .where(
        and(
          eq(missionCca.slackChannelId, input.slackChannelId),
          ne(missionCca.id, input.keepMissionId),
        ),
      );
  }
}

export async function finalizeMissionDriveLink(
  userId: string,
  folderId: string,
): Promise<void> {
  await ensureMissionStandardSubfolders(userId, folderId);
}
