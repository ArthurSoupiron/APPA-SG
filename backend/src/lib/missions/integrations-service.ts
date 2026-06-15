import { eq, inArray, isNotNull } from "drizzle-orm";

import { db } from "../../db";
import { commercialClient, missionCca, slackUserGroup } from "../../db/schema";
import { user } from "../../db/schema/auth/user";
import type { MissionIntegrationState } from "../../types/missions-api";
import {
  ensureMissionStandardSubfolders,
  getDriveFileState,
  getOrCreateMissionDriveFolder,
  listMissionDriveFoldersFromRoot,
  restoreDriveFileFromTrash,
} from "./mission-drive-service";
import {
  createSlackChannelWithVisibilityCore,
  getSlackChannelStateCore,
  inviteUsersToSlackChannelCore,
  listSlackUserGroupMembersCore,
  listSlackWorkspaceChannelsCore,
  normalizeSlackChannelName,
  pinSlackMessageCore,
  postSlackMessageCore,
} from "./mission-slack-service";
import { updateCca } from "./repositories/cca";
import { listMissionSlackGroupConfigIds } from "./repositories/slack-group-config";

type MissionBasicFields = {
  id: string;
  missionName: string;
  driveFolderId: string | null;
  slackChannelId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
  clientName: string | null;
  cdpName: string | null;
  entrepriseId: string;
};

async function getMissionBasicFields(missionId: string): Promise<MissionBasicFields | null> {
  const [row] = await db
    .select({
      id: missionCca.id,
      missionName: missionCca.missionName,
      driveFolderId: missionCca.driveFolderId,
      slackChannelId: missionCca.slackChannelId,
      startDate: missionCca.startDate,
      endDate: missionCca.endDate,
      description: missionCca.description,
      entrepriseId: missionCca.entrepriseId,
      clientNom: commercialClient.nomClient,
      clientPrenom: commercialClient.prenomClient,
      cdpName: user.name,
    })
    .from(missionCca)
    .leftJoin(commercialClient, eq(missionCca.clientId, commercialClient.id))
    .leftJoin(user, eq(missionCca.cdpId, user.id))
    .where(eq(missionCca.id, missionId))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    missionName: row.missionName,
    driveFolderId: row.driveFolderId,
    slackChannelId: row.slackChannelId,
    startDate: row.startDate,
    endDate: row.endDate,
    description: row.description,
    entrepriseId: row.entrepriseId,
    clientName: `${row.clientNom ?? ""} ${row.clientPrenom ?? ""}`.trim() || null,
    cdpName: row.cdpName,
  };
}

function formatMissionDate(value: Date | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(value));
}

function buildMissionPinnedMessage(mission: MissionBasicFields): string {
  return [
    "📌 *Fiche mission*",
    `• *Mission*: ${mission.missionName}`,
    `• *Client*: ${mission.clientName ?? "-"}`,
    `• *CDP*: ${mission.cdpName ?? "-"}`,
    `• *Entreprise ID*: ${mission.entrepriseId}`,
    `• *Début*: ${formatMissionDate(mission.startDate)}`,
    `• *Fin*: ${formatMissionDate(mission.endDate)}`,
    `• *Description*: ${mission.description?.trim() || "-"}`,
    `• *Mission ID*: \`${mission.id}\``,
  ].join("\n");
}

async function postMissionPinnedSummary(mission: MissionBasicFields): Promise<void> {
  if (!mission.slackChannelId) return;
  const post = await postSlackMessageCore(
    mission.slackChannelId,
    buildMissionPinnedMessage(mission),
  );
  if (!post.success || !post.ts) return;
  await pinSlackMessageCore(mission.slackChannelId, post.ts);
}

async function postMissionLog(
  mission: { slackChannelId: string | null },
  message: string,
): Promise<void> {
  if (!mission.slackChannelId) return;
  await postSlackMessageCore(mission.slackChannelId, `📝 *Journal mission*\n${message}`);
}

export async function getMissionIntegrationState(
  userId: string,
  missionId: string,
): Promise<MissionIntegrationState | null> {
  const mission = await getMissionBasicFields(missionId);
  if (!mission) return null;

  const slackTokenConfigured = Boolean(
    process.env.SLACK_USER_BOT_TOKEN?.trim() || process.env.SLACK_BOT_TOKEN?.trim(),
  );

  let driveLinked = Boolean(mission.driveFolderId);
  let driveValid = false;
  let driveIssue: string | null = null;
  let driveUrl: string | null = null;

  if (mission.driveFolderId) {
    driveUrl = `https://drive.google.com/drive/folders/${mission.driveFolderId}`;
    const state = await getDriveFileState(userId, mission.driveFolderId);
    driveValid = state.exists && !state.trashed;
    if (!state.exists) driveIssue = "Dossier Drive introuvable.";
    else if (state.trashed) driveIssue = "Dossier Drive en corbeille.";
  }

  let slackLinked = Boolean(mission.slackChannelId);
  let slackValid = false;
  let slackIssue: string | null = null;
  let slackUrl: string | null = null;

  if (mission.slackChannelId) {
    slackUrl = `https://app.slack.com/client/T00000000/${mission.slackChannelId}`;
    const state = await getSlackChannelStateCore(mission.slackChannelId);
    slackValid = state.exists;
    if (!state.exists) slackIssue = state.error ?? "Canal Slack introuvable.";
  }

  const channelsResult = await listSlackWorkspaceChannelsCore();
  const slackChannels = channelsResult.channels.map((c) => ({ id: c.id, name: c.name }));

  const selectedGroupIds = await listMissionSlackGroupConfigIds();
  const configuredSlackGroups =
    selectedGroupIds.length === 0
      ? []
      : await db
          .select({
            id: slackUserGroup.id,
            name: slackUserGroup.name,
            handle: slackUserGroup.handle,
          })
          .from(slackUserGroup)
          .where(inArray(slackUserGroup.id, selectedGroupIds));

  const statusColor: MissionIntegrationState["statusColor"] =
    driveLinked && driveValid && slackLinked && slackValid
      ? "green"
      : driveLinked || slackLinked
        ? "orange"
        : "gray";

  return {
    pluginsReady: slackTokenConfigured,
    drive: { linked: driveLinked, valid: driveValid, issue: driveIssue, url: driveUrl },
    slack: {
      linked: slackLinked,
      valid: slackValid,
      issue: slackIssue,
      channelId: mission.slackChannelId,
      url: slackUrl,
    },
    statusColor,
    slackChannels,
    configuredSlackGroups: configuredSlackGroups.map((g) => ({
      id: g.id,
      name: g.handle ? `@${g.handle}` : (g.name ?? g.id),
    })),
  };
}

export async function ensureMissionDriveLink(
  userId: string,
  missionId: string,
): Promise<{ folderId: string; folderUrl: string }> {
  const mission = await getMissionBasicFields(missionId);
  if (!mission) throw new Error("Mission introuvable.");
  const year = (mission.startDate ?? new Date()).getFullYear();
  const folder = await getOrCreateMissionDriveFolder(
    userId,
    mission.missionName,
    year,
    mission.driveFolderId,
  );
  if (!folder) throw new Error("Impossible de créer le dossier Drive.");
  await ensureMissionStandardSubfolders(userId, folder.folderId);
  if (mission.driveFolderId) {
    const state = await getDriveFileState(userId, mission.driveFolderId);
    if (state.trashed) await restoreDriveFileFromTrash(userId, mission.driveFolderId);
  }
  await updateCca(missionId, { driveFolderId: folder.folderId, updatedBy: userId });
  return folder;
}

export async function createMissionSlackChannel(
  missionId: string,
  groupId: string,
): Promise<{ channelId: string }> {
  const mission = await getMissionBasicFields(missionId);
  if (!mission) throw new Error("Mission introuvable.");
  const selectedGroupIds = await listMissionSlackGroupConfigIds();
  if (!selectedGroupIds.includes(groupId)) {
    throw new Error("Le groupe choisi doit faire partie de la configuration mission.");
  }
  const channelName = normalizeSlackChannelName(
    mission.missionName || `mission-${mission.id.slice(0, 8)}`,
  );
  const created = await createSlackChannelWithVisibilityCore(channelName, true);
  let channelId = created.channelId;
  if (!created.success || !channelId) {
    if (created.error === "name_taken") {
      const channelsResult = await listSlackWorkspaceChannelsCore();
      const existing = channelsResult.channels.find(
        (ch) => normalizeSlackChannelName(ch.name) === channelName,
      );
      if (!existing) throw new Error("Canal existant introuvable pour relink.");
      channelId = existing.id;
    } else {
      throw new Error(created.error ?? "Échec création canal Slack.");
    }
  }
  const members = await listSlackUserGroupMembersCore(groupId);
  if (!members.success) {
    throw new Error(members.error ?? "Impossible de récupérer les membres du groupe Slack.");
  }
  if (members.userIds.length > 0) {
    const invited = await inviteUsersToSlackChannelCore(channelId, members.userIds);
    if (!invited.success && invited.error !== "cant_invite_self") {
      throw new Error(invited.error ?? "Invitation du groupe impossible.");
    }
  }
  await updateCca(missionId, { slackChannelId: channelId });
  const updated = await getMissionBasicFields(missionId);
  if (updated) await postMissionPinnedSummary(updated);
  await postMissionLog(
    { slackChannelId: channelId },
    `Canal Slack créé et lié à la mission.`,
  );
  return { channelId };
}

export async function linkMissionSlackChannel(
  missionId: string,
  channelId: string,
): Promise<void> {
  const mission = await getMissionBasicFields(missionId);
  if (!mission) throw new Error("Mission introuvable.");
  await updateCca(missionId, { slackChannelId: channelId });
  const updated = await getMissionBasicFields(missionId);
  if (updated) {
    await postMissionPinnedSummary(updated);
    await postMissionLog(updated, `Canal Slack lié : ${channelId}`);
  }
}

export async function debugSendMissionSlackMessage(
  missionId: string,
  text: string,
): Promise<void> {
  const mission = await getMissionBasicFields(missionId);
  if (!mission?.slackChannelId) throw new Error("Canal Slack non lié.");
  const result = await postSlackMessageCore(
    mission.slackChannelId,
    `🧪 *Debug envoi mission*\n${text}`,
  );
  if (!result.success) throw new Error(result.error ?? "Échec envoi Slack.");
}

export async function debugSendMissionSlackGroupTagMessage(
  missionId: string,
  groupId: string,
): Promise<void> {
  const mission = await getMissionBasicFields(missionId);
  if (!mission?.slackChannelId) throw new Error("Canal Slack non lié.");
  const result = await postSlackMessageCore(
    mission.slackChannelId,
    `🧪 *Debug tag groupe Slack*\n<!subteam^${groupId}>`,
  );
  if (!result.success) throw new Error(result.error ?? "Échec envoi Slack.");
}

export async function postCreateMissionSlackSummary(missionId: string): Promise<void> {
  const mission = await getMissionBasicFields(missionId);
  if (!mission?.slackChannelId) return;
  await postMissionPinnedSummary(mission);
  await postMissionLog(mission, "Mission créée — canal Slack relié.");
}

export async function getMissionCreateIntegrationOptions(userId: string): Promise<{
  driveAvailable: boolean;
  driveError?: string;
  driveFolders: Array<{
    id: string;
    name: string;
    year: string;
    label: string;
    webViewLink: string;
    linkedMissionName: string | null;
  }>;
  slackAvailable: boolean;
  slackError?: string;
  slackChannels: Array<{ id: string; name: string }>;
}> {
  const linkedRows = await db
    .select({
      driveFolderId: missionCca.driveFolderId,
      missionName: missionCca.missionName,
    })
    .from(missionCca)
    .where(isNotNull(missionCca.driveFolderId));

  const linkedByFolderId = new Map<string, string>();
  for (const row of linkedRows) {
    if (row.driveFolderId) {
      linkedByFolderId.set(row.driveFolderId, row.missionName);
    }
  }

  const driveScan = await listMissionDriveFoldersFromRoot(userId, linkedByFolderId);
  const channelsResult = await listSlackWorkspaceChannelsCore();

  return {
    driveAvailable: !driveScan.error,
    driveError: driveScan.error,
    driveFolders: driveScan.folders,
    slackAvailable: channelsResult.success,
    slackError: channelsResult.success
      ? undefined
      : (channelsResult.error ?? "Token Slack non configuré."),
    slackChannels: channelsResult.success
      ? channelsResult.channels.map((c) => ({ id: c.id, name: c.name }))
      : [],
  };
}
