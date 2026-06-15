import { eq } from "drizzle-orm";

import { db } from "../../db";
import { commercialClient, commercialEntreprise, missionCca } from "../../db/schema";
import type {
  BddMatrixStatus,
  DocMatrixCell,
  DriveMatrixStatus,
  MissionBcDocsMatrixRow,
  MissionDocsMatrix,
  MissionMissionLevelDocs,
} from "../../types/missions-api";
import { formatBcDisplayLabel } from "./format-bc-label";
import {
  ensureMissionStandardSubfolders,
  getDriveFileMetadata,
  getOrCreateMissionDriveFolder,
  getOrCreateSubfolder,
  listFilesInFolder,
  MISSION_DRIVE_SUBFOLDER_CDC,
  MISSION_DRIVE_SUBFOLDER_PROPALE,
} from "./mission-drive-service";
import { getWorkflowStateByMission } from "./workflow-service";

type BddHalf = { status: BddMatrixStatus; issue?: string };
type DriveHalf = { status: DriveMatrixStatus; issue?: string };

const bddAbsentHalf: BddHalf = { status: "absent" };
const driveAbsentHalf: DriveHalf = { status: "absent" };

function cellHalf(bdd: BddHalf, drive: DriveHalf): DocMatrixCell {
  return {
    bdd: bdd.status,
    drive: drive.status,
    issueBdd: bdd.issue,
    issueDrive: drive.issue,
  };
}

function combinePair(
  bdd: { docx: BddHalf; pdf: BddHalf },
  drive: { docx: DriveHalf; pdf: DriveHalf },
): { docx: DocMatrixCell; pdf: DocMatrixCell } {
  return {
    docx: cellHalf(bdd.docx, drive.docx),
    pdf: cellHalf(bdd.pdf, drive.pdf),
  };
}

function isNonFolder(f: { mimeType: string }): boolean {
  return f.mimeType !== "application/vnd.google-apps.folder";
}

function isHtmlOrDocx(name: string): boolean {
  const n = name.toLowerCase();
  return n.endsWith(".html") || n.endsWith(".docx");
}

function isPdf(name: string): boolean {
  return name.toLowerCase().endsWith(".pdf");
}

function buildDriveHtmlPdfCells(input: {
  hasHtml: boolean;
  hasPdf: boolean;
  prefixLabel: string;
}): { docx: DriveHalf; pdf: DriveHalf } {
  const { hasHtml, hasPdf, prefixLabel } = input;
  if (!hasHtml && !hasPdf) {
    return { docx: driveAbsentHalf, pdf: driveAbsentHalf };
  }
  if (hasHtml && !hasPdf) {
    return {
      docx: {
        status: "present",
        issue: `${prefixLabel} (Drive) : HTML présent dans le dossier.`,
      },
      pdf: {
        status: "absent",
        issue: `${prefixLabel} (Drive) : PDF absent (attente validation).`,
      },
    };
  }
  if (!hasHtml && hasPdf) {
    return {
      docx: driveAbsentHalf,
      pdf: {
        status: "present",
        issue: `${prefixLabel} (Drive) : PDF présent dans le dossier.`,
      },
    };
  }
  return {
    docx: {
      status: "inconsistency",
      issue: `${prefixLabel} (Drive) : HTML résiduel alors que le PDF est présent.`,
    },
    pdf: {
      status: "present",
      issue: `${prefixLabel} (Drive) : PDF présent dans le dossier.`,
    },
  };
}

function buildDriveFolderPdfOnlyCells(
  files: Array<{ name: string; mimeType: string }>,
  prefixLabel: string,
): { docx: DriveHalf; pdf: DriveHalf } {
  const nonFolder = files.filter(isNonFolder);
  const hasPdf = nonFolder.some((f) => isPdf(f.name));
  return {
    docx: driveAbsentHalf,
    pdf: hasPdf
      ? {
          status: "present",
          issue: `${prefixLabel} (Drive) : PDF présent dans le dossier.`,
        }
      : {
          status: "absent",
          issue: `${prefixLabel} (Drive) : aucun PDF dans ce dossier.`,
        },
  };
}

function bddCcaPair(ccaGeneratedFileId: string | null | undefined): {
  docx: BddHalf;
  pdf: BddHalf;
} {
  if (!ccaGeneratedFileId) {
    const pending: BddHalf = {
      status: "pending_drive",
      issue: "CCA (BDD) : entité suivie mais pas encore de fichier généré / référencé.",
    };
    return { docx: pending, pdf: pending };
  }
  const synced: BddHalf = {
    status: "synced",
    issue: "CCA (BDD) : référence fichier enregistrée (généré sur Drive).",
  };
  return { docx: synced, pdf: synced };
}

function bddEntityTracked(
  present: boolean,
  generatedFileId: string | undefined,
  label: string,
): { docx: BddHalf; pdf: BddHalf } {
  if (!present) {
    return {
      docx: { status: "absent", issue: `${label} (BDD) : pas d'entité.` },
      pdf: { status: "absent", issue: `${label} (BDD) : pas d'entité.` },
    };
  }
  if (!generatedFileId) {
    const pending: BddHalf = {
      status: "pending_drive",
      issue: `${label} (BDD) : entité présente, pas encore de fichier généré référencé.`,
    };
    return { docx: pending, pdf: pending };
  }
  const synced: BddHalf = {
    status: "synced",
    issue: `${label} (BDD) : référence fichier en base.`,
  };
  return { docx: synced, pdf: synced };
}

function driveFolderOnlyPair(drive: { docx: DriveHalf; pdf: DriveHalf }): {
  docx: DocMatrixCell;
  pdf: DocMatrixCell;
} {
  return {
    docx: cellHalf(bddAbsentHalf, drive.docx),
    pdf: cellHalf(bddAbsentHalf, drive.pdf),
  };
}

function buildMissionLevelDocsFromFiles(
  missionRootFiles: Array<{ name: string; mimeType: string }>,
  cdcFiles: Array<{ name: string; mimeType: string }>,
  propaleFiles: Array<{ name: string; mimeType: string }>,
  ccaGeneratedFileId: string | null | undefined,
): MissionMissionLevelDocs {
  const root = missionRootFiles.filter(isNonFolder);
  const hasCcaHtml = root.some(
    (f) => isHtmlOrDocx(f.name) && /^CCA_/i.test(f.name),
  );
  const hasCcaPdf = root.some((f) => isPdf(f.name) && /^CCA_/i.test(f.name));
  const cca = combinePair(
    bddCcaPair(ccaGeneratedFileId),
    buildDriveHtmlPdfCells({ hasHtml: hasCcaHtml, hasPdf: hasCcaPdf, prefixLabel: "CCA" }),
  );
  const cdc = driveFolderOnlyPair(buildDriveFolderPdfOnlyCells(cdcFiles, "CDC"));
  const propale = driveFolderOnlyPair(buildDriveFolderPdfOnlyCells(propaleFiles, "Propale"));
  return {
    cdc: { docx: cdc.docx, pdf: cdc.pdf },
    propale: { docx: propale.docx, pdf: propale.pdf },
    cca: { docx: cca.docx, pdf: cca.pdf },
  };
}

async function loadDriveMetadataBatch(
  userId: string,
  ids: string[],
): Promise<Map<string, Awaited<ReturnType<typeof getDriveFileMetadata>>>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, Awaited<ReturnType<typeof getDriveFileMetadata>>>();
  const results = await Promise.all(unique.map((id) => getDriveFileMetadata(userId, id)));
  for (let i = 0; i < unique.length; i += 1) {
    const id = unique[i];
    const r = results[i];
    if (id !== undefined && r !== undefined) map.set(id, r);
  }
  return map;
}

function hasMissingFromMap(
  metaById: Map<string, Awaited<ReturnType<typeof getDriveFileMetadata>>>,
  fileIds: string[],
): boolean {
  if (fileIds.length === 0) return false;
  return fileIds.some((id) => {
    const m = metaById.get(id);
    return !m?.exists || m.trashed;
  });
}

function scanBcDocPair(
  files: Array<{ name: string }>,
  prefix: string,
): { docx: DriveHalf; pdf: DriveHalf } {
  const matching = files.filter((f) => f.name.toUpperCase().startsWith(prefix));
  const hasHtml = matching.some((f) => isHtmlOrDocx(f.name));
  const hasPdf = matching.some((f) => isPdf(f.name));
  return buildDriveHtmlPdfCells({ hasHtml, hasPdf, prefixLabel: prefix.replace(/_$/, "") });
}

async function getMissionContext(userId: string, missionId: string) {
  const [row] = await db
    .select({
      id: missionCca.id,
      missionName: missionCca.missionName,
      driveFolderId: missionCca.driveFolderId,
      generatedFileId: missionCca.generatedFileId,
      startDate: missionCca.startDate,
      clientNom: commercialClient.nomClient,
      clientPrenom: commercialClient.prenomClient,
      entrepriseNom: commercialEntreprise.nomEntreprise,
    })
    .from(missionCca)
    .leftJoin(commercialClient, eq(missionCca.clientId, commercialClient.id))
    .leftJoin(commercialEntreprise, eq(missionCca.entrepriseId, commercialEntreprise.id))
    .where(eq(missionCca.id, missionId))
    .limit(1);
  if (!row) throw new Error("Mission introuvable.");
  return { missionRow: row };
}

export async function getMissionMissionLevelDocsOnly(
  userId: string,
  missionId: string,
): Promise<MissionMissionLevelDocs | null> {
  try {
    const mission = await getMissionContext(userId, missionId);
    const year = (mission.missionRow.startDate ?? new Date()).getFullYear();
    const missionFolder = await getOrCreateMissionDriveFolder(
      userId,
      mission.missionRow.missionName,
      year,
      mission.missionRow.driveFolderId ?? undefined,
    );
    if (!missionFolder) return null;
    await ensureMissionStandardSubfolders(userId, missionFolder.folderId);
    const missionFiles = await listFilesInFolder(userId, missionFolder.folderId);
    const cdcFolderId = await getOrCreateSubfolder(
      userId,
      missionFolder.folderId,
      MISSION_DRIVE_SUBFOLDER_CDC,
    );
    const propaleFolderId = await getOrCreateSubfolder(
      userId,
      missionFolder.folderId,
      MISSION_DRIVE_SUBFOLDER_PROPALE,
    );
    const cdcFiles = cdcFolderId ? await listFilesInFolder(userId, cdcFolderId) : [];
    const propaleFiles = propaleFolderId
      ? await listFilesInFolder(userId, propaleFolderId)
      : [];
    return buildMissionLevelDocsFromFiles(
      missionFiles,
      cdcFiles,
      propaleFiles,
      mission.missionRow.generatedFileId,
    );
  } catch {
    return null;
  }
}

export async function getMissionBcDocsMatrix(
  userId: string,
  missionId: string,
): Promise<MissionDocsMatrix> {
  const mission = await getMissionContext(userId, missionId);
  const ws = await getWorkflowStateByMission(missionId);
  const year = (mission.missionRow.startDate ?? new Date()).getFullYear();
  const missionFolder = await getOrCreateMissionDriveFolder(
    userId,
    mission.missionRow.missionName,
    year,
    mission.missionRow.driveFolderId ?? undefined,
  );
  if (!missionFolder) {
    throw new Error("Dossier Drive mission introuvable.");
  }
  await ensureMissionStandardSubfolders(userId, missionFolder.folderId);
  const missionFiles = await listFilesInFolder(userId, missionFolder.folderId);
  const cdcFolderId = await getOrCreateSubfolder(
    userId,
    missionFolder.folderId,
    MISSION_DRIVE_SUBFOLDER_CDC,
  );
  const propaleFolderId = await getOrCreateSubfolder(
    userId,
    missionFolder.folderId,
    MISSION_DRIVE_SUBFOLDER_PROPALE,
  );
  const cdcFiles = cdcFolderId ? await listFilesInFolder(userId, cdcFolderId) : [];
  const propaleFiles = propaleFolderId
    ? await listFilesInFolder(userId, propaleFolderId)
    : [];
  const missionLevel = buildMissionLevelDocsFromFiles(
    missionFiles,
    cdcFiles,
    propaleFiles,
    mission.missionRow.generatedFileId,
  );

  const allFileIds: string[] = [];
  if (mission.missionRow.generatedFileId) allFileIds.push(mission.missionRow.generatedFileId);
  for (const bc of ws.bcs) {
    if (bc.bc.generatedFileId) allFileIds.push(bc.bc.generatedFileId);
    if (bc.fa?.generatedFileId) allFileIds.push(bc.fa.generatedFileId);
    for (const fs of bc.fs) if (fs.generatedFileId) allFileIds.push(fs.generatedFileId);
    if (bc.rmi?.generatedFileId) allFileIds.push(bc.rmi.generatedFileId);
    for (const bv of bc.bv) if (bv.generatedFileId) allFileIds.push(bv.generatedFileId);
    if (bc.pvrf?.generatedFileId) allFileIds.push(bc.pvrf.generatedFileId);
    if (bc.qs?.generatedFileId) allFileIds.push(bc.qs.generatedFileId);
  }
  const metaById = await loadDriveMetadataBatch(userId, allFileIds);

  const rows: MissionBcDocsMatrixRow[] = [];
  for (const bc of ws.bcs) {
    const bcFolderId = await getOrCreateSubfolder(
      userId,
      missionFolder.folderId,
      formatBcDisplayLabel(bc.bc.type, bc.bc.bcNumber),
    );
    const bcFiles = bcFolderId ? await listFilesInFolder(userId, bcFolderId) : [];
    const nonFolder = bcFiles.filter(isNonFolder);

    const bcBdd = bddEntityTracked(true, bc.bc.generatedFileId ?? undefined, "BC");
    const bcDrive = scanBcDocPair(nonFolder, `BC_${bc.bc.bcNumber}`);
    const faBdd = bddEntityTracked(
      !!bc.fa,
      bc.fa?.generatedFileId ?? undefined,
      "FA",
    );
    const faDrive = scanBcDocPair(nonFolder, `FA_`);
    const fsBdd = bddEntityTracked(
      bc.fs.length > 0,
      bc.fs[0]?.generatedFileId ?? undefined,
      "FS",
    );
    const fsDrive = scanBcDocPair(nonFolder, `FS_`);
    const rmiBdd = bddEntityTracked(!!bc.rmi, bc.rmi?.generatedFileId ?? undefined, "RMI");
    const rmiDrive = scanBcDocPair(nonFolder, `RMI_`);
    const pvrfBdd = bddEntityTracked(!!bc.pvrf, bc.pvrf?.generatedFileId ?? undefined, "PVRF");
    const pvrfDrive = scanBcDocPair(nonFolder, `PVRF_`);
    const bvBdd = bddEntityTracked(
      bc.bv.length > 0,
      bc.bv[0]?.generatedFileId ?? undefined,
      "BV",
    );
    const bvDrive = scanBcDocPair(nonFolder, `BV_`);
    const qsBdd = bddEntityTracked(!!bc.qs, bc.qs?.generatedFileId ?? undefined, "QS");
    const qsDrive = scanBcDocPair(nonFolder, `QS_`);

    const bcIds = [bc.bc.generatedFileId].filter(Boolean) as string[];
    if (hasMissingFromMap(metaById, bcIds)) {
      const err: DriveHalf = {
        status: "trashed",
        issue: "BC (Drive) : référence fichier invalide ou en corbeille.",
      };
      bcDrive.docx = err;
      bcDrive.pdf = err;
    }

    rows.push({
      bcId: bc.bc.id,
      bcLabel: formatBcDisplayLabel(bc.bc.type, bc.bc.bcNumber),
      docs: {
        bcDocx: combinePair(bcBdd, bcDrive).docx,
        bcPdf: combinePair(bcBdd, bcDrive).pdf,
        faDocx: combinePair(faBdd, faDrive).docx,
        faPdf: combinePair(faBdd, faDrive).pdf,
        fsDocx: combinePair(fsBdd, fsDrive).docx,
        fsPdf: combinePair(fsBdd, fsDrive).pdf,
        rmiDocx: combinePair(rmiBdd, rmiDrive).docx,
        rmiPdf: combinePair(rmiBdd, rmiDrive).pdf,
        pvrfDocx: combinePair(pvrfBdd, pvrfDrive).docx,
        pvrfPdf: combinePair(pvrfBdd, pvrfDrive).pdf,
        bvDocx: combinePair(bvBdd, bvDrive).docx,
        bvPdf: combinePair(bvBdd, bvDrive).pdf,
        qsDocx: combinePair(qsBdd, qsDrive).docx,
        qsPdf: combinePair(qsBdd, qsDrive).pdf,
      },
    });
  }

  return { mission: missionLevel, rows };
}
