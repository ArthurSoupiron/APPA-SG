import { desc, eq } from "drizzle-orm";

import { db } from "../../db";
import { user } from "../../db/schema/auth/user";
import { commercialClient, commercialEntreprise, missionCca } from "../../db/schema";
import type {
  CreateMissionInput,
  MissionBcSummaryRow,
  MissionFormOptions,
  MissionRow,
  UpdateMissionInput,
} from "../../types/missions";
import type { MissionDocsMatrixListSlice } from "../../types/missions-api";
import { formatBcDisplayLabel } from "./format-bc-label";
import { getMissionBcDocsMatrix, getMissionMissionLevelDocsOnly } from "./docs-matrix-service";
import { renameDriveFile } from "./mission-drive-service";
import { syncMissionAgendaMilestones } from "./mission-agenda-sync";
import { renameSlackChannelCore } from "./mission-slack-service";
import { getCdpFormOptions } from "./cdp-options-service";
import {
  detachIntegrationsFromOtherMissions,
  finalizeMissionDriveLink,
  validateDriveFolderForMissionLink,
  validateSlackChannelForMissionLink,
} from "./create-mission-integrations";
import { postCreateMissionSlackSummary } from "./integrations-service";
import { loadMissionCommercialInfosFromDriveFolder } from "./mission-drive-infos-service";
import { createCca, getCcaById, updateCca } from "./repositories/cca";
import { getWorkflowStateByMission, getWorkflowStatesByMissions } from "./workflow-service";
import type { BcWorkflowState } from "./workflow-service";

function toNumberOrZero(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function computeBcAmountHt(bc: BcWorkflowState): number {
  const designationTotal = bc.designations.reduce((sum, d) => {
    const explicit = toNumberOrZero(d.prixTotalHt);
    if (explicit > 0) return sum + explicit;
    const nbJeh = toNumberOrZero(d.nbJeh);
    const montantJeh = toNumberOrZero(d.montantJeh);
    return sum + nbJeh * montantJeh;
  }, 0);
  const fraisTotal = bc.frais.reduce((sum, f) => sum + toNumberOrZero(f.montantHt), 0);
  return designationTotal + fraisTotal;
}

function computeBcJeh(bc: BcWorkflowState): number {
  return bc.designations.reduce((sum, d) => sum + toNumberOrZero(d.nbJeh), 0);
}

function countDistinctIntervenantsOnBc(bc: BcWorkflowState): number {
  const ids = new Set<string>();
  for (const d of bc.designations) {
    if (d.intervenantId) ids.add(d.intervenantId);
  }
  return ids.size;
}

function computeMissionTotalIntervenantCount(ws: { bcs: BcWorkflowState[] }): number {
  const ids = new Set<string>();
  for (const bc of ws.bcs) {
    for (const d of bc.designations) {
      if (d.intervenantId) ids.add(d.intervenantId);
    }
  }
  return ids.size;
}

function mapBcSummaries(ws: { bcs: BcWorkflowState[] }): MissionBcSummaryRow[] {
  return ws.bcs.map((bc) => ({
    bcId: bc.bc.id,
    label: formatBcDisplayLabel(bc.bc.type, bc.bc.bcNumber),
    bcKind: bc.bc.type,
    stages: bc.stages,
    amountHt: computeBcAmountHt(bc),
    totalJeh: computeBcJeh(bc),
    intervenantCount: countDistinctIntervenantsOnBc(bc),
  }));
}

type MissionQueryRow = {
  id: string;
  missionName: string;
  clientId: string;
  clientNom: string | null;
  clientPrenom: string | null;
  clientTelephone: string | null;
  clientMail: string | null;
  cdpId: string | null;
  cdpName: string | null;
  entrepriseId: string;
  entrepriseNom: string | null;
  entrepriseTelephone: string | null;
  entrepriseMail: string | null;
  entrepriseAdresse: string | null;
  entrepriseVille: string | null;
  entrepriseCodePostal: string | null;
  entreprisePays: string | null;
  entrepriseSiren: string | null;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  driveFolderId: string | null;
  slackChannelId: string | null;
  updatedAt: Date;
};

function mapMissionRow(
  mission: MissionQueryRow,
  ws: { bcs: BcWorkflowState[] },
): MissionRow {
  const bcSummaries = mapBcSummaries(ws);
  const totalAmountHt = bcSummaries.reduce((sum, bc) => sum + bc.amountHt, 0);
  const totalJeh = bcSummaries.reduce((sum, bc) => sum + bc.totalJeh, 0);
  const totalIntervenantCount = computeMissionTotalIntervenantCount(ws);
  const clientName =
    `${mission.clientNom ?? ""} ${mission.clientPrenom ?? ""}`.trim() || null;
  return {
    id: mission.id,
    missionName: mission.missionName,
    clientId: mission.clientId,
    clientNom: mission.clientNom,
    clientPrenom: mission.clientPrenom,
    clientTelephone: mission.clientTelephone,
    clientMail: mission.clientMail,
    clientName,
    entrepriseTelephone: mission.entrepriseTelephone,
    entrepriseMail: mission.entrepriseMail,
    entrepriseAdresse: mission.entrepriseAdresse,
    entrepriseVille: mission.entrepriseVille,
    entrepriseCodePostal: mission.entrepriseCodePostal,
    entreprisePays: mission.entreprisePays,
    entrepriseSiren: mission.entrepriseSiren,
    entrepriseName: mission.entrepriseNom,
    cdpId: mission.cdpId,
    cdpName: mission.cdpName,
    entrepriseId: mission.entrepriseId,
    description: mission.description,
    startDate: mission.startDate,
    endDate: mission.endDate,
    driveFolderId: mission.driveFolderId,
    slackChannelId: mission.slackChannelId,
    bcCount: bcSummaries.length,
    totalAmountHt,
    totalJeh,
    totalIntervenantCount,
    bcSummaries,
    updatedAt: mission.updatedAt,
  };
}

async function queryMissionBase(limit = 50) {
  return db
    .select({
      id: missionCca.id,
      missionName: missionCca.missionName,
      clientId: missionCca.clientId,
      clientNom: commercialClient.nomClient,
      clientPrenom: commercialClient.prenomClient,
      clientTelephone: commercialClient.telephoneClient,
      clientMail: commercialClient.mailClient,
      cdpId: missionCca.cdpId,
      cdpName: user.name,
      entrepriseId: missionCca.entrepriseId,
      entrepriseNom: commercialEntreprise.nomEntreprise,
      entrepriseTelephone: commercialEntreprise.telephoneEntreprise,
      entrepriseMail: commercialEntreprise.mailEntreprise,
      entrepriseAdresse: commercialEntreprise.adresseEntreprise,
      entrepriseVille: commercialEntreprise.villeEntreprise,
      entrepriseCodePostal: commercialEntreprise.codePostalEntreprise,
      entreprisePays: commercialEntreprise.paysEntreprise,
      entrepriseSiren: commercialEntreprise.sirenEntreprise,
      description: missionCca.description,
      startDate: missionCca.startDate,
      endDate: missionCca.endDate,
      driveFolderId: missionCca.driveFolderId,
      slackChannelId: missionCca.slackChannelId,
      updatedAt: missionCca.updatedAt,
    })
    .from(missionCca)
    .leftJoin(commercialClient, eq(missionCca.clientId, commercialClient.id))
    .leftJoin(commercialEntreprise, eq(missionCca.entrepriseId, commercialEntreprise.id))
    .leftJoin(user, eq(missionCca.cdpId, user.id))
    .orderBy(desc(missionCca.updatedAt))
    .limit(limit);
}

export async function getMissionsList(limit = 50): Promise<MissionRow[]> {
  const missions = await queryMissionBase(limit);
  const missionIds = missions.map((m) => m.id);
  const workflowStates = await getWorkflowStatesByMissions(missionIds);
  const workflowStateById = new Map(workflowStates.map((ws) => [ws.missionId, ws]));
  return missions.map((mission) => {
    const ws = workflowStateById.get(mission.id) ?? { missionId: mission.id, bcs: [] };
    return mapMissionRow(mission, ws);
  });
}

export async function getMissionById(missionId: string): Promise<MissionRow | null> {
  const [mission] = await db
    .select({
      id: missionCca.id,
      missionName: missionCca.missionName,
      clientId: missionCca.clientId,
      clientNom: commercialClient.nomClient,
      clientPrenom: commercialClient.prenomClient,
      clientTelephone: commercialClient.telephoneClient,
      clientMail: commercialClient.mailClient,
      cdpId: missionCca.cdpId,
      cdpName: user.name,
      entrepriseId: missionCca.entrepriseId,
      entrepriseNom: commercialEntreprise.nomEntreprise,
      entrepriseTelephone: commercialEntreprise.telephoneEntreprise,
      entrepriseMail: commercialEntreprise.mailEntreprise,
      entrepriseAdresse: commercialEntreprise.adresseEntreprise,
      entrepriseVille: commercialEntreprise.villeEntreprise,
      entrepriseCodePostal: commercialEntreprise.codePostalEntreprise,
      entreprisePays: commercialEntreprise.paysEntreprise,
      entrepriseSiren: commercialEntreprise.sirenEntreprise,
      description: missionCca.description,
      startDate: missionCca.startDate,
      endDate: missionCca.endDate,
      driveFolderId: missionCca.driveFolderId,
      slackChannelId: missionCca.slackChannelId,
      updatedAt: missionCca.updatedAt,
    })
    .from(missionCca)
    .leftJoin(commercialClient, eq(missionCca.clientId, commercialClient.id))
    .leftJoin(commercialEntreprise, eq(missionCca.entrepriseId, commercialEntreprise.id))
    .leftJoin(user, eq(missionCca.cdpId, user.id))
    .where(eq(missionCca.id, missionId))
    .limit(1);
  if (!mission) return null;
  const ws = await getWorkflowStateByMission(mission.id);
  return mapMissionRow(mission, ws);
}

export async function getMissionFormOptions(): Promise<MissionFormOptions> {
  const [clients, entreprises, cdps] = await Promise.all([
    db
      .select({
        id: commercialClient.id,
        nom: commercialClient.nomClient,
        prenom: commercialClient.prenomClient,
      })
      .from(commercialClient)
      .orderBy(commercialClient.nomClient),
    db
      .select({
        id: commercialEntreprise.id,
        nom: commercialEntreprise.nomEntreprise,
      })
      .from(commercialEntreprise)
      .orderBy(commercialEntreprise.nomEntreprise),
    getCdpFormOptions(),
  ]);
  return {
    clients: clients.map((c) => ({
      id: c.id,
      label: `${c.nom} ${c.prenom}`.trim(),
    })),
    entreprises: entreprises.map((e) => ({ id: e.id, label: e.nom })),
    cdps,
  };
}

export async function createMission(
  input: CreateMissionInput,
  userId: string,
): Promise<{ id: string }> {
  const now = new Date();
  const id = crypto.randomUUID();
  const cdpId = input.cdpId?.trim() || null;
  if (cdpId) {
    const cdps = await getCdpFormOptions();
    const match = cdps.find((c) => c.id === cdpId && c.hasAppUser);
    if (!match) throw new Error("CDP invalide ou non inscrit dans l'application.");
  }

  const driveRaw = input.driveFolderIdOrUrl?.trim() ?? "";
  const slackRaw = input.slackChannelId?.trim() ?? "";
  let driveFolderId: string | null = null;
  let slackChannelId: string | null = null;

  if (driveRaw) {
    driveFolderId = await validateDriveFolderForMissionLink(userId, driveRaw);
  }
  if (slackRaw) {
    slackChannelId = await validateSlackChannelForMissionLink(slackRaw);
  }

  await createCca({
    id,
    missionName: input.missionName.trim(),
    clientId: input.clientId,
    entrepriseId: input.entrepriseId,
    cdpId,
    description: input.description?.trim() || null,
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    driveFolderId,
    slackChannelId,
  });

  await detachIntegrationsFromOtherMissions({
    driveFolderId,
    slackChannelId,
    keepMissionId: id,
  });

  if (driveFolderId) {
    const infos = await loadMissionCommercialInfosFromDriveFolder(userId, driveFolderId);
    if (!infos.found) {
      console.warn(
        `[createMission] Dossier Drive ${driveFolderId} sans fichier infos_mission.txt (ou .txt).`,
      );
    } else if (infos.error) {
      console.warn(
        `[createMission] Fichier infos invalide dans ${driveFolderId} (${infos.fileName ?? "?"}): ${infos.error}`,
      );
    }
    await finalizeMissionDriveLink(userId, driveFolderId);
  }
  if (slackChannelId) {
    await postCreateMissionSlackSummary(id);
  }

  await syncMissionAgendaMilestones(id, userId);
  return { id };
}

export async function updateMission(
  input: UpdateMissionInput,
  userId: string,
): Promise<void> {
  const before = await getCcaById(input.id);
  if (!before) throw new Error("Mission introuvable.");
  const nextMissionName = input.missionName.trim();
  const cdpId = input.cdpId?.trim() || null;
  if (cdpId) {
    const cdps = await getCdpFormOptions();
    const match = cdps.find((c) => c.id === cdpId && c.hasAppUser);
    if (!match) throw new Error("CDP invalide ou non inscrit dans l'application.");
  }
  await updateCca(input.id, {
    missionName: nextMissionName,
    clientId: input.clientId,
    entrepriseId: input.entrepriseId,
    cdpId,
    description: input.description?.trim() || null,
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
    updatedBy: userId,
  });
  await syncMissionAgendaMilestones(input.id, userId);
  if (before.missionName !== nextMissionName) {
    if (before.slackChannelId) {
      await renameSlackChannelCore(before.slackChannelId, nextMissionName);
    }
    if (before.driveFolderId) {
      await renameDriveFile(userId, before.driveFolderId, nextMissionName);
    }
  }
}

export async function hydrateMissionsDocsMatricesForList(
  userId: string,
  missionIds: string[],
): Promise<MissionDocsMatrixListSlice[]> {
  const unique = [...new Set(missionIds)];
  const CONCURRENCY = 5;
  const results: MissionDocsMatrixListSlice[] = [];
  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const chunk = unique.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (missionId) => {
        try {
          const full = await getMissionBcDocsMatrix(userId, missionId);
          return {
            missionId,
            missionLevelDocs: full.mission,
            bcDocsMatrixRows: full.rows,
          };
        } catch {
          const fallback = await getMissionMissionLevelDocsOnly(userId, missionId);
          return {
            missionId,
            missionLevelDocs: fallback,
            bcDocsMatrixRows: [],
          };
        }
      }),
    );
    results.push(...chunkResults);
  }
  return results;
}
