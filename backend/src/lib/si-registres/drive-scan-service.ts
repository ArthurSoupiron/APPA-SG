import { eq } from "drizzle-orm";

import { db } from "../../db";
import {
  registreLicences,
  registreRgpd,
  traitementData,
} from "../../db/schema";
import {
  PREUVE_CONSENTEMENT_FOLDER,
  PREUVE_MENTIONS_FOLDER,
  PREUVES_RGPD_FOLDER,
  driveFolderBrowseUrl,
  findChildFolderByName,
  getDriveApiForUser,
  getRegistresDriveRootFolderId,
  listChildFolders,
  listFilesInFolder,
  parseRegistreFolderName,
} from "./drive";
import { driveFolderUrlExists } from "./registres-service";
import {
  decryptTraitementDataRow,
  encryptTraitementDataField,
} from "./traitement-data-crypto";
import { getNextTraitementDataReference } from "./traitement-data-service";
import type { DriveScanReport } from "./types";

async function importRgpdOrLicence(
  userId: string,
  type: "rgpd" | "licences",
  folder: { id: string; name: string; webViewLink: string | null },
  report: DriveScanReport,
): Promise<void> {
  const folderUrl = folder.webViewLink ?? driveFolderBrowseUrl(folder.id);
  if (await driveFolderUrlExists(folderUrl)) {
    report.skipped += 1;
    return;
  }

  const parsed = parseRegistreFolderName(folder.name, type);
  if (!parsed) {
    report.errors.push(`Nom non reconnu (${type}) : ${folder.name}`);
    return;
  }

  const id = crypto.randomUUID();
  if (type === "rgpd") {
    await db.insert(registreRgpd).values({
      id,
      userId,
      anneeCivile: parsed.anneeCivile,
      nom: parsed.nom,
      driveFolderUrl: folderUrl,
    });
  } else {
    await db.insert(registreLicences).values({
      id,
      userId,
      anneeCivile: parsed.anneeCivile,
      nom: parsed.nom,
      driveFolderUrl: folderUrl,
    });
  }
  report.created += 1;
}

async function importTraitementFolder(
  userId: string,
  folder: { id: string; name: string; webViewLink: string | null },
  api: Awaited<ReturnType<typeof getDriveApiForUser>> & { ok: true },
  report: DriveScanReport,
): Promise<void> {
  const folderUrl = folder.webViewLink ?? driveFolderBrowseUrl(folder.id);
  if (await driveFolderUrlExists(folderUrl)) {
    report.skipped += 1;
    return;
  }

  const nomTraitement = folder.name.replace(/^Traitement_\d+_/, "") || folder.name;
  const reference = await getNextTraitementDataReference();
  const id = crypto.randomUUID();

  let preuveConsentementUrl: string | null = null;
  let preuveMentionsUrl: string | null = null;
  let fichePdfUrl: string | null = null;

  const preuvesId = await findChildFolderByName(api.api, folder.id, PREUVES_RGPD_FOLDER);
  if (preuvesId) {
    const consentId = await findChildFolderByName(api.api, preuvesId, PREUVE_CONSENTEMENT_FOLDER);
    const mentionsId = await findChildFolderByName(api.api, preuvesId, PREUVE_MENTIONS_FOLDER);
    if (consentId) {
      const files = await listFilesInFolder(api.api, consentId);
      preuveConsentementUrl = files[0]?.webViewLink ?? null;
    }
    if (mentionsId) {
      const files = await listFilesInFolder(api.api, mentionsId);
      preuveMentionsUrl = files[0]?.webViewLink ?? null;
    }
  }

  const rootFiles = await listFilesInFolder(api.api, folder.id);
  const pdf = rootFiles.find((f) => f.name.toLowerCase().endsWith(".pdf"));
  fichePdfUrl = pdf?.webViewLink ?? null;

  await db.insert(traitementData).values({
    id,
    userId,
    nomTraitement: encryptTraitementDataField(nomTraitement) ?? nomTraitement,
    reference: encryptTraitementDataField(reference) ?? reference,
    driveFolderUrl: folderUrl,
    preuveConsentementUrl,
    preuveMentionsUrl,
    fichePdfUrl,
    dateCreationFiche: new Date(),
    dateMiseAJourFiche: new Date(),
  });
  report.created += 1;
}

export async function scanRegistresDrive(
  userId: string,
  rootFolderIdOverride?: string,
): Promise<DriveScanReport | { error: string }> {
  const rootId = getRegistresDriveRootFolderId(rootFolderIdOverride);
  if (!rootId) return { error: "DRIVE_REGISTRES_FOLDER_URL n'est pas configuré." };

  const driveRes = await getDriveApiForUser(userId);
  if (!driveRes.ok) return { error: driveRes.message };

  const report: DriveScanReport = { created: 0, skipped: 0, errors: [] };
  const rootChildren = await listChildFolders(driveRes.api, rootId);

  for (const child of rootChildren) {
    const lower = child.name.toLowerCase();
    if (lower === "licence" || lower === "licences") {
      const subfolders = await listChildFolders(driveRes.api, child.id);
      for (const f of subfolders) {
        await importRgpdOrLicence(userId, "licences", f, report);
      }
      continue;
    }
    if (lower === "rgpd") {
      const subfolders = await listChildFolders(driveRes.api, child.id);
      for (const f of subfolders) {
        await importRgpdOrLicence(userId, "rgpd", f, report);
      }
      continue;
    }

    if (child.name.startsWith("Traitement_") || child.name.startsWith("Registre_")) {
      if (child.name.startsWith("Registre_")) {
        report.errors.push(`Dossier registre à la racine ignoré : ${child.name}`);
        continue;
      }
      await importTraitementFolder(userId, child, driveRes, report);
    }
  }

  return report;
}

export async function findTraitementByDriveUrl(url: string) {
  const [row] = await db
    .select()
    .from(traitementData)
    .where(eq(traitementData.driveFolderUrl, url))
    .limit(1);
  return row ? decryptTraitementDataRow(row) : null;
}
