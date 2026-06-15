import { readFile } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";

import { db } from "../../db";
import { missionCca } from "../../db/schema";
import type { PendingTemplateFile, TemplateDocType } from "../../types/missions-api";
import { appendMissionDocumentEvent } from "./audit-service";
import {
  deleteDriveFile,
  downloadDriveFileMediaBuffer,
  getOrCreateMissionDriveFolder,
  getOrCreateSubfolder,
  listFilesInFolder,
  MISSION_DRIVE_SUBFOLDER_TEMPLATE,
  uploadFileToDriveWithId,
} from "./mission-drive-service";
import { renderHtmlToPdfBuffer } from "./pdf-renderer";
import { updateCca } from "./repositories/cca";
import { getBonCommandeById } from "./repositories/bon-commande";
import { updateBonCommande } from "./repositories/bon-commande";

const TEMPLATE_DIR = path.join(import.meta.dir, "templates", "html");

const TEMPLATE_FILE_BY_DOC: Record<TemplateDocType, string> = {
  CCA: "template_cca.html",
  BC: "template_cca.html",
  BCR: "template_cca.html",
  RMI: "template_cca.html",
  ARMI: "template_cca.html",
  PVRF: "template_cca.html",
};

function replaceTags(html: string, values: Record<string, string>): string {
  let out = html;
  for (const [key, value] of Object.entries(values)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

function extractTags(html: string): string[] {
  const tags = new Set<string>();
  const re = /\{\{([A-Z0-9_]+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1]) tags.add(m[1]);
  }
  return [...tags];
}

async function loadTemplateHtml(docType: TemplateDocType): Promise<string> {
  const fileName = TEMPLATE_FILE_BY_DOC[docType];
  const filePath = path.join(TEMPLATE_DIR, fileName);
  return readFile(filePath, "utf8");
}

async function getMissionContext(missionId: string) {
  const [row] = await db
    .select()
    .from(missionCca)
    .where(eq(missionCca.id, missionId))
    .limit(1);
  if (!row) throw new Error("Mission introuvable.");
  return row;
}

export async function getMissionTemplateGenerationFormData(
  missionId: string,
  _bcId: string | null,
  documentType: TemplateDocType,
) {
  const mission = await getMissionContext(missionId);
  const templateHtml = await loadTemplateHtml(documentType);
  const tags = extractTags(templateHtml);
  return {
    documentType,
    tags,
    prefill: {
      MISSION_NAME: mission.missionName,
      DESCRIPTION: mission.description ?? "",
      START_DATE: mission.startDate?.toISOString().slice(0, 10) ?? "",
      END_DATE: mission.endDate?.toISOString().slice(0, 10) ?? "",
    },
    targets: [{ label: "Document principal", id: "main" }],
  };
}

export async function previewMissionTemplateDryRun(
  documentType: TemplateDocType,
  values: Record<string, string>,
) {
  const templateHtml = await loadTemplateHtml(documentType);
  const tags = extractTags(templateHtml);
  const missing = tags.filter((t) => !(t in values));
  return { tags, missing, resolved: tags.length - missing.length };
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
): Promise<{ htmlUrl: string; htmlFileId: string }> {
  const mission = await getMissionContext(missionId);
  const year = (mission.startDate ?? new Date()).getFullYear();
  const folder = await getOrCreateMissionDriveFolder(
    userId,
    mission.missionName,
    year,
    mission.driveFolderId,
  );
  if (!folder) throw new Error("Dossier Drive mission introuvable.");

  const templateHtml = await loadTemplateHtml(input.documentType);
  const rendered = replaceTags(templateHtml, input.values);
  const baseName = `${input.documentType}_${input.documentNumber}`;
  const fileName = `${baseName}.html`;

  let targetFolderId = folder.folderId;
  if (input.bcId) {
    const bc = await getBonCommandeById(input.bcId);
    if (!bc || bc.ccaId !== missionId) throw new Error("BC introuvable.");
    const bcFolder = await getOrCreateSubfolder(
      userId,
      folder.folderId,
      `${bc.type} ${bc.bcNumber}`,
    );
    if (bcFolder) targetFolderId = bcFolder;
  }

  const uploaded = await uploadFileToDriveWithId(
    userId,
    Buffer.from(rendered, "utf8"),
    fileName,
    "text/html",
    targetFolderId,
  );
  if (!uploaded) throw new Error("Échec upload HTML sur Drive.");

  if (input.documentType === "CCA") {
    await updateCca(missionId, { generatedFileId: uploaded.id });
  } else if (input.bcId) {
    await updateBonCommande(input.bcId, { generatedFileId: uploaded.id, updatedBy: userId });
  }

  await appendMissionDocumentEvent({
    missionId,
    bcId: input.bcId ?? null,
    entityType: input.documentType === "CCA" ? "cca" : "bc",
    entityId: input.bcId ?? missionId,
    eventType: "bc_updated",
    label: `Template ${input.documentType} généré : ${fileName}`,
    changedBy: userId,
  });

  return { htmlUrl: uploaded.webViewLink, htmlFileId: uploaded.id };
}

export async function listPendingTemplateHtml(
  userId: string,
  missionId: string,
  bcId: string | null,
  documentType: TemplateDocType,
): Promise<PendingTemplateFile[]> {
  const mission = await getMissionContext(missionId);
  const year = (mission.startDate ?? new Date()).getFullYear();
  const folder = await getOrCreateMissionDriveFolder(
    userId,
    mission.missionName,
    year,
    mission.driveFolderId,
  );
  if (!folder) return [];

  let targetFolderId = folder.folderId;
  if (bcId) {
    const bc = await getBonCommandeById(bcId);
    if (bc) {
      const bcFolder = await getOrCreateSubfolder(
        userId,
        folder.folderId,
        `${bc.type} ${bc.bcNumber}`,
      );
      if (bcFolder) targetFolderId = bcFolder;
    }
  }

  const files = await listFilesInFolder(userId, targetFolderId);
  const prefix = `${documentType}_`.toLowerCase();
  return files
    .filter(
      (f) =>
        f.name.toLowerCase().startsWith(prefix) &&
        (f.name.toLowerCase().endsWith(".html") || f.mimeType === "text/html"),
    )
    .map((f) => ({ id: f.id, name: f.name, webViewLink: f.webViewLink }));
}

export async function validateTemplateHtml(
  userId: string,
  missionId: string,
  input: {
    bcId?: string | null;
    documentType: TemplateDocType;
    htmlFileId: string;
    outputBaseName?: string;
  },
): Promise<{ pdfUrl: string; pdfFileId: string }> {
  const mission = await getMissionContext(missionId);
  const year = (mission.startDate ?? new Date()).getFullYear();
  const folder = await getOrCreateMissionDriveFolder(
    userId,
    mission.missionName,
    year,
    mission.driveFolderId,
  );
  if (!folder) throw new Error("Dossier Drive mission introuvable.");

  const htmlBuffer = await downloadDriveFileMediaBuffer(userId, input.htmlFileId);
  if (!htmlBuffer) throw new Error("Impossible de télécharger le HTML source.");
  const pdfBuffer = await renderHtmlToPdfBuffer(htmlBuffer.toString("utf8"));
  const baseName = input.outputBaseName ?? `${input.documentType}_validated`;
  const pdfName = `${baseName}.pdf`;

  let targetFolderId = folder.folderId;
  if (input.bcId) {
    const bc = await getBonCommandeById(input.bcId);
    if (bc) {
      const bcFolder = await getOrCreateSubfolder(
        userId,
        folder.folderId,
        `${bc.type} ${bc.bcNumber}`,
      );
      if (bcFolder) targetFolderId = bcFolder;
    }
  }

  const uploaded = await uploadFileToDriveWithId(
    userId,
    pdfBuffer,
    pdfName,
    "application/pdf",
    targetFolderId,
  );
  if (!uploaded) throw new Error("Échec upload PDF sur Drive.");

  if (input.documentType === "CCA") {
    await updateCca(missionId, { generatedFileId: uploaded.id });
  } else if (input.bcId) {
    await updateBonCommande(input.bcId, { generatedFileId: uploaded.id, updatedBy: userId });
  }

  await deleteDriveFile(userId, input.htmlFileId);

  await appendMissionDocumentEvent({
    missionId,
    bcId: input.bcId ?? null,
    entityType: input.documentType === "CCA" ? "cca" : "bc",
    entityId: input.bcId ?? missionId,
    eventType: "bc_updated",
    label: `Template ${input.documentType} validé → PDF : ${pdfName}`,
    changedBy: userId,
  });

  return { pdfUrl: uploaded.webViewLink, pdfFileId: uploaded.id };
}

export async function syncHtmlTemplatesFromDrive(userId: string) {
  const templateFolderId = await getOrCreateSubfolder(
    userId,
    process.env.DRIVE_MISSIONS_ROOT_ID ?? "",
    MISSION_DRIVE_SUBFOLDER_TEMPLATE,
  );
  if (!templateFolderId) return { synced: 0 };
  const files = await listFilesInFolder(userId, templateFolderId);
  return {
    synced: files.filter((f) => f.name.toLowerCase().endsWith(".html")).length,
    files: files.map((f) => ({ id: f.id, name: f.name })),
  };
}
