import Docxtemplater from "docxtemplater";
import { eq } from "drizzle-orm";
import PizZip from "pizzip";

import { db } from "../../db";
import { gmDriveTemplateTags } from "../../db/schema";
import { user } from "../../db/schema/auth/user";
import type { PendingTemplateFile, TemplateDocType } from "../../types/missions-api";
import { appendMissionDocumentEvent } from "./audit-service";
import { getMissionContextQuery } from "./mission-context-query";
import {
  convertDriveDocxToPdfAndDelete,
  DRIVE_MISSIONS_ROOT_ID,
  downloadDriveFileMediaBuffer,
  exportGoogleDocAsDocxBuffer,
  getOrCreateMissionDriveFolder,
  getOrCreateSubfolder,
  listFilesInFolder,
  MISSION_DRIVE_SUBFOLDER_TEMPLATE,
  uploadFileToDriveWithId,
} from "./mission-drive-service";
import {
  getBonCommandeById,
  listBonCommandeDesignationsByBc,
  listBonCommandeFraisByBc,
  updateBonCommande,
} from "./repositories/bon-commande";
import { updateCca } from "./repositories/cca";
import { updatePvrf } from "./repositories/pvrf";
import { updateRmi } from "./repositories/rmi";
import {
  getTemplateTagAudit,
  resolvePrefillByTags,
} from "./template-canonical-tags";
import {
  getTemplateFileName,
  inferDocTypeFromTemplateFileName,
} from "./template-doc-config";
import { extractTemplateTagsFromDocxBuffer } from "./template-scan";
import { getWorkflowStateByMission } from "./workflow-service";

const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type DriveMissionTemplateScanItem = {
  id: string;
  name: string;
  kind: "docx" | "google_doc";
  webViewLink: string;
  tags: string[];
  unknownCanonicalTags?: string[];
  error?: string;
};

export type ListDriveMissionTemplatesResult =
  | {
      ok: true;
      folderId: string;
      folderUrl: string;
      items: DriveMissionTemplateScanItem[];
    }
  | { ok: false; error: string };

async function findDriveTemplateFileForDocType(
  userId: string,
  docType: TemplateDocType,
): Promise<{
  id: string;
  name: string;
  webViewLink: string;
  mimeType: string;
} | null> {
  const folderId = await getOrCreateSubfolder(
    userId,
    DRIVE_MISSIONS_ROOT_ID,
    MISSION_DRIVE_SUBFOLDER_TEMPLATE,
  );
  if (!folderId) return null;
  const files = await listFilesInFolder(userId, folderId);
  const expectedFileName = getTemplateFileName(docType);
  if (!expectedFileName) return null;
  const expectedLower = expectedFileName.toLowerCase();
  const baseLower = expectedLower.replace(/\.docx$/i, "");
  return (
    files.find((f) => {
      if (f.mimeType === "application/vnd.google-apps.folder") return false;
      const n = f.name.trim().toLowerCase();
      return n === expectedLower || n === baseLower || n === `${baseLower}.docx`;
    }) ?? null
  );
}

async function loadDriveTemplateForDocType(
  userId: string,
  docType: TemplateDocType,
): Promise<{ buffer: Buffer; driveFileName: string }> {
  const file = await findDriveTemplateFileForDocType(userId, docType);
  if (!file) {
    const expected = getTemplateFileName(docType);
    throw new Error(
      `Template Drive introuvable : ajoutez « ${expected} » (DOCX) ou un Google Doc nommé « ${expected.replace(/\.docx$/i, "")} » dans le dossier Template.`,
    );
  }
  const isGoogleDoc = file.mimeType === GOOGLE_DOC_MIME;
  const buffer = isGoogleDoc
    ? await exportGoogleDocAsDocxBuffer(userId, file.id)
    : await downloadDriveFileMediaBuffer(userId, file.id);
  if (!buffer) throw new Error(`Impossible de lire le template Drive « ${file.name} ».`);
  return { buffer, driveFileName: file.name };
}

function fillTemplateDocxBuffer(
  templateBuffer: Buffer,
  values: Record<string, string>,
): Buffer {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "<<", end: ">>" },
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(values);
  return doc.getZip().generate({ type: "nodebuffer" });
}

async function getMissionAndBcContext(missionId: string, bcId: string) {
  const mission = await getMissionContextQuery(missionId);
  const bc = await getBonCommandeById(bcId);
  if (!bc || bc.ccaId !== missionId) throw new Error("BC introuvable pour cette mission.");
  const designations = await listBonCommandeDesignationsByBc(bcId);
  const frais = await listBonCommandeFraisByBc(bcId);
  return { ...mission, bc, designations, frais };
}

function buildMissionTemplatePrefillRecord(
  docType: TemplateDocType,
  mission: Awaited<ReturnType<typeof getMissionContextQuery>>,
  bcCtx: Awaited<ReturnType<typeof getMissionAndBcContext>> | null,
): Record<string, string> {
  const totalDesignationHt = (bcCtx?.designations ?? []).reduce(
    (sum, d) =>
      sum +
      (Number(d.prixTotalHt ?? Number(d.nbJeh ?? 0) * Number(d.montantJeh ?? 0)) || 0),
    0,
  );
  const totalFraisHt = (bcCtx?.frais ?? []).reduce(
    (sum, f) => sum + Number(f.montantHt ?? 0),
    0,
  );
  const base: Record<string, string> = {
    Nom_Entreprise: mission.entrepriseName,
    Nom_Contact: mission.clientName,
    Nom_CDP: mission.missionRow.cdpName ?? "",
    "Référence Document": bcCtx?.bc.bcNumber ?? "",
    "Date Edition": new Date().toLocaleDateString("fr-FR"),
    presentation: mission.missionRow.description ?? "",
    BC_NUMBER: bcCtx?.bc.bcNumber ?? "",
    MISSION_NAME: mission.missionRow.missionName,
    TYPE_DOCUMENT: docType,
    TOTAL_HT: String(totalDesignationHt + totalFraisHt || 0),
  };
  return base;
}

async function resolveTemplateTargetFolder(
  userId: string,
  input: { missionId: string; bcId?: string | null; documentType: TemplateDocType },
): Promise<{ folderId: string; missionName: string; bcNumber: string | null }> {
  const mission = await getMissionContextQuery(input.missionId);
  const year = (mission.missionRow.startDate ?? new Date()).getFullYear();
  const missionFolder = await getOrCreateMissionDriveFolder(
    userId,
    mission.missionRow.missionName,
    year,
    mission.missionRow.driveFolderId ?? undefined,
  );
  if (!missionFolder) throw new Error("Dossier mission Drive introuvable.");
  if (!mission.missionRow.driveFolderId) {
    await updateCca(input.missionId, { driveFolderId: missionFolder.folderId });
  }
  if (input.documentType === "CCA") {
    return {
      folderId: missionFolder.folderId,
      missionName: mission.missionRow.missionName,
      bcNumber: null,
    };
  }
  if (!input.bcId) throw new Error("BC requis pour ce document.");
  const bc = await getBonCommandeById(input.bcId);
  if (!bc) throw new Error("BC introuvable.");
  const bcFolderId = await getOrCreateSubfolder(
    userId,
    missionFolder.folderId,
    `${bc.type} ${bc.bcNumber}`,
  );
  if (!bcFolderId) throw new Error("Impossible de créer le dossier BC sur Drive.");
  return {
    folderId: bcFolderId,
    missionName: mission.missionRow.missionName,
    bcNumber: bc.bcNumber,
  };
}

export async function getMissionTemplateGenerationFormData(
  userId: string,
  missionId: string,
  bcId: string | null,
  documentType: TemplateDocType,
) {
  const [row] = await db
    .select()
    .from(gmDriveTemplateTags)
    .where(eq(gmDriveTemplateTags.docType, documentType))
    .limit(1);
  if (!row) {
    throw new Error(
      `Aucune balise en base pour ${documentType}. Synchronisez les modèles depuis Config Jaeger → Templates.`,
    );
  }
  let prefill: Record<string, string>;
  if (bcId) {
    const full = await getMissionAndBcContext(missionId, bcId);
    prefill = buildMissionTemplatePrefillRecord(documentType, full, full);
  } else {
    const mission = await getMissionContextQuery(missionId);
    prefill = buildMissionTemplatePrefillRecord(documentType, mission, null);
  }
  const resolvedPrefill = resolvePrefillByTags(row.tags, prefill);

  let generationTargets: Array<{
    id: string;
    label: string;
    name: string | null;
    email: string | null;
  }> = [];
  if (bcId && (documentType === "RMI" || documentType === "ARMI")) {
    const designations = await listBonCommandeDesignationsByBc(bcId);
    const intervenantIds = Array.from(
      new Set(
        designations.map((d) => d.intervenantId).filter((id): id is string => Boolean(id)),
      ),
    );
    generationTargets = await Promise.all(
      intervenantIds.map(async (intervenantId) => {
        const [rowUser] = await db
          .select({ id: user.id, name: user.name, email: user.email })
          .from(user)
          .where(eq(user.id, intervenantId))
          .limit(1);
        return {
          id: intervenantId,
          label: rowUser?.name ?? rowUser?.email ?? intervenantId,
          name: rowUser?.name ?? null,
          email: rowUser?.email ?? null,
        };
      }),
    );
  }

  return {
    documentType,
    fileName: row.driveFileName,
    tags: row.tags,
    prefill: resolvedPrefill,
    targets: generationTargets.map((t) => ({
      label: t.label,
      id: t.id,
    })),
    generationTargets,
  };
}

export async function previewMissionTemplateDryRun(
  userId: string,
  documentType: TemplateDocType,
  values: Record<string, string>,
) {
  const { buffer } = await loadDriveTemplateForDocType(userId, documentType);
  const tags = extractTemplateTagsFromDocxBuffer(buffer);
  const resolved = resolvePrefillByTags(tags, values);
  const missing = tags.filter((t) => !resolved[t]?.trim());
  return { tags, missing, resolved: tags.length - missing.length };
}

export async function previewMissionTemplateDocx(
  userId: string,
  input: {
    missionId: string;
    bcId?: string | null;
    documentType: TemplateDocType;
    values: Record<string, string>;
    perTargetValues?: Record<string, Record<string, string>>;
    targetIntervenantId?: string | null;
  },
): Promise<{ docxBase64: string; targetLabel: string | null }> {
  const { documentType: docType } = input;

  if (docType === "RMI" || docType === "ARMI") {
    if (!input.bcId) throw new Error("BC requis pour la prévisualisation RMI/ARMI.");
    const designations = await listBonCommandeDesignationsByBc(input.bcId);
    const intervenantIds = Array.from(
      new Set(
        designations.map((d) => d.intervenantId).filter((id): id is string => Boolean(id)),
      ),
    );
    if (intervenantIds.length === 0) {
      throw new Error("Aucun intervenant affecté aux désignations du BC.");
    }
    const fallbackIntervenantId = intervenantIds[0];
    if (!fallbackIntervenantId) {
      throw new Error("Aucun intervenant affecté aux désignations du BC.");
    }
    const selectedIntervenantId =
      input.targetIntervenantId && intervenantIds.includes(input.targetIntervenantId)
        ? input.targetIntervenantId
        : fallbackIntervenantId;
    const [rowUser] = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, selectedIntervenantId))
      .limit(1);
    const targetValues = input.perTargetValues?.[selectedIntervenantId] ?? {};
    const renderValues = {
      ...input.values,
      ...targetValues,
      INTERVENANT_ID: selectedIntervenantId,
      INTERVENANT_NAME: rowUser?.name ?? "",
      INTERVENANT_EMAIL: rowUser?.email ?? "",
      Nom_Intervenant: rowUser?.name ?? "",
      Mail_Intervenant: rowUser?.email ?? "",
    };
    const { buffer } = await loadDriveTemplateForDocType(userId, docType);
    const docxBuffer = fillTemplateDocxBuffer(buffer, renderValues);
    return {
      docxBase64: docxBuffer.toString("base64"),
      targetLabel: rowUser?.name ?? rowUser?.email ?? selectedIntervenantId,
    };
  }

  const { buffer } = await loadDriveTemplateForDocType(userId, docType);
  const docxBuffer = fillTemplateDocxBuffer(buffer, input.values);
  return { docxBase64: docxBuffer.toString("base64"), targetLabel: null };
}

export async function generateMissionTemplateDocument(
  userId: string,
  missionId: string,
  input: {
    bcId?: string | null;
    documentType: TemplateDocType;
    documentNumber: string;
    values: Record<string, string>;
  },
): Promise<{ docxUrl: string; docxFileId: string }> {
  const target = await resolveTemplateTargetFolder(userId, {
    missionId,
    bcId: input.bcId,
    documentType: input.documentType,
  });
  const { buffer } = await loadDriveTemplateForDocType(userId, input.documentType);
  const docxBuffer = fillTemplateDocxBuffer(buffer, input.values);
  const safeBaseName = `${input.documentType}_${input.documentNumber || target.bcNumber || target.missionName}_${Date.now()}`;
  const uploaded = await uploadFileToDriveWithId(
    userId,
    docxBuffer,
    `${safeBaseName}.docx`,
    DOCX_MIME,
    target.folderId,
  );
  if (!uploaded) throw new Error("Upload DOCX impossible.");

  if (input.documentType === "CCA") {
    await updateCca(missionId, { generatedFileId: uploaded.id });
  } else if (input.bcId && (input.documentType === "BC" || input.documentType === "BCR")) {
    await updateBonCommande(input.bcId, { generatedFileId: uploaded.id, updatedBy: userId });
  } else if (input.bcId && (input.documentType === "RMI" || input.documentType === "ARMI")) {
    const ws = await getWorkflowStateByMission(missionId);
    const bcState = ws.bcs.find((x) => x.bc.id === input.bcId);
    if (bcState?.rmi?.id) {
      await updateRmi(bcState.rmi.id, { generatedFileId: uploaded.id, updatedBy: userId });
    }
  } else if (input.bcId && input.documentType === "PVRF") {
    const ws = await getWorkflowStateByMission(missionId);
    const bcState = ws.bcs.find((x) => x.bc.id === input.bcId);
    if (bcState?.pvrf?.id) {
      await updatePvrf(bcState.pvrf.id, { generatedFileId: uploaded.id, updatedBy: userId });
    }
  }

  await appendMissionDocumentEvent({
    missionId,
    bcId: input.bcId ?? null,
    entityType: input.documentType === "CCA" ? "cca" : "bc",
    entityId: input.bcId ?? missionId,
    eventType: "bc_updated",
    label: `Template ${input.documentType} généré : ${safeBaseName}.docx`,
    changedBy: userId,
  });

  return { docxUrl: uploaded.webViewLink, docxFileId: uploaded.id };
}

export async function listPendingTemplateDocx(
  userId: string,
  missionId: string,
  bcId: string | null,
  documentType: TemplateDocType,
): Promise<PendingTemplateFile[]> {
  const target = await resolveTemplateTargetFolder(userId, {
    missionId,
    bcId,
    documentType,
  });
  const files = await listFilesInFolder(userId, target.folderId);
  const prefix = `${documentType}_`.toLowerCase();
  return files
    .filter(
      (f) =>
        f.name.toLowerCase().startsWith(prefix) && f.name.toLowerCase().endsWith(".docx"),
    )
    .map((f) => ({ id: f.id, name: f.name, webViewLink: f.webViewLink }));
}

export async function validateTemplateDocx(
  userId: string,
  missionId: string,
  input: {
    bcId?: string | null;
    documentType: TemplateDocType;
    docxFileId: string;
    outputBaseName?: string;
  },
): Promise<{ pdfUrl: string; pdfFileId: string }> {
  const target = await resolveTemplateTargetFolder(userId, {
    missionId,
    bcId: input.bcId,
    documentType: input.documentType,
  });
  const outputBaseName =
    input.outputBaseName?.trim() ||
    `${input.documentType}_${target.bcNumber || target.missionName}_${Date.now()}`;
  const pdf = await convertDriveDocxToPdfAndDelete(
    userId,
    input.docxFileId,
    target.folderId,
    `${outputBaseName}.pdf`,
  );
  if (!pdf) throw new Error("Validation impossible (conversion PDF échouée).");

  if (input.documentType === "CCA") {
    await updateCca(missionId, { generatedFileId: pdf.id });
  } else if (input.bcId && (input.documentType === "BC" || input.documentType === "BCR")) {
    await updateBonCommande(input.bcId, { generatedFileId: pdf.id, updatedBy: userId });
  } else if (input.bcId && (input.documentType === "RMI" || input.documentType === "ARMI")) {
    const ws = await getWorkflowStateByMission(missionId);
    const bcState = ws.bcs.find((x) => x.bc.id === input.bcId);
    if (bcState?.rmi?.id) {
      await updateRmi(bcState.rmi.id, { generatedFileId: pdf.id, updatedBy: userId });
    }
  } else if (input.bcId && input.documentType === "PVRF") {
    const ws = await getWorkflowStateByMission(missionId);
    const bcState = ws.bcs.find((x) => x.bc.id === input.bcId);
    if (bcState?.pvrf?.id) {
      await updatePvrf(bcState.pvrf.id, { generatedFileId: pdf.id, updatedBy: userId });
    }
  }

  await appendMissionDocumentEvent({
    missionId,
    bcId: input.bcId ?? null,
    entityType: input.documentType === "CCA" ? "cca" : "bc",
    entityId: input.bcId ?? missionId,
    eventType: "bc_updated",
    label: `Template ${input.documentType} validé → PDF : ${outputBaseName}.pdf`,
    changedBy: userId,
  });

  return { pdfUrl: pdf.webViewLink, pdfFileId: pdf.id };
}

async function persistDriveTemplateTagsFromScan(items: DriveMissionTemplateScanItem[]) {
  const now = new Date();
  for (const item of items) {
    if (item.error) continue;
    const docType = inferDocTypeFromTemplateFileName(item.name);
    if (!docType) continue;
    await db
      .insert(gmDriveTemplateTags)
      .values({
        docType,
        driveFileId: item.id,
        driveFileName: item.name,
        tags: item.tags,
        syncedAt: now,
      })
      .onConflictDoUpdate({
        target: gmDriveTemplateTags.docType,
        set: {
          driveFileId: item.id,
          driveFileName: item.name,
          tags: item.tags,
          syncedAt: now,
        },
      });
  }
}

export async function syncDriveTemplatesFromDrive(
  userId: string,
): Promise<ListDriveMissionTemplatesResult> {
  const templateFolderId = await getOrCreateSubfolder(
    userId,
    DRIVE_MISSIONS_ROOT_ID,
    MISSION_DRIVE_SUBFOLDER_TEMPLATE,
  );
  if (!templateFolderId) {
    return { ok: false, error: "Dossier Template introuvable ou impossible à créer sur Drive." };
  }
  const folderUrl = `https://drive.google.com/drive/folders/${templateFolderId}`;
  const files = await listFilesInFolder(userId, templateFolderId);
  const targets = files.filter((f) => {
    if (f.mimeType === "application/vnd.google-apps.folder") return false;
    const isGoogleDoc = f.mimeType === GOOGLE_DOC_MIME;
    const isDocx = f.mimeType === DOCX_MIME || f.name.toLowerCase().endsWith(".docx");
    return isGoogleDoc || isDocx;
  });

  const CONCURRENCY = 4;
  const items: DriveMissionTemplateScanItem[] = [];

  async function scanOneFile(
    f: (typeof targets)[number],
  ): Promise<DriveMissionTemplateScanItem> {
    const isGoogleDoc = f.mimeType === GOOGLE_DOC_MIME;
    const kind: "docx" | "google_doc" = isGoogleDoc ? "google_doc" : "docx";
    let buffer: Buffer | null = null;
    let err: string | undefined;
    if (isGoogleDoc) {
      buffer = await exportGoogleDocAsDocxBuffer(userId, f.id);
      if (!buffer) err = "Export Google Doc impossible.";
    } else {
      buffer = await downloadDriveFileMediaBuffer(userId, f.id);
      if (!buffer) err = "Téléchargement DOCX impossible.";
    }
    let tags: string[] = [];
    if (buffer && !err) {
      try {
        tags = extractTemplateTagsFromDocxBuffer(buffer);
      } catch (e) {
        err = e instanceof Error ? e.message : "Analyse du modèle impossible.";
      }
    }
    const inferredDocType = inferDocTypeFromTemplateFileName(f.name);
    const unknownCanonicalTags = inferredDocType
      ? getTemplateTagAudit(inferredDocType, tags).unknownTags
      : [];

    return {
      id: f.id,
      name: f.name,
      kind,
      webViewLink: f.webViewLink,
      tags,
      unknownCanonicalTags,
      error: err,
    };
  }

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const chunk = targets.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(chunk.map((f) => scanOneFile(f)));
    items.push(...chunkResults);
  }

  items.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  await persistDriveTemplateTagsFromScan(items);
  return { ok: true, folderId: templateFolderId, folderUrl, items };
}
