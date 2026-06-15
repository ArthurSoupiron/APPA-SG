import { desc, eq } from "drizzle-orm";

import { db } from "../../db";
import { traitementData, user } from "../../db/schema";
import {
  PREUVE_CONSENTEMENT_FOLDER,
  PREUVE_MENTIONS_FOLDER,
  PREUVES_RGPD_FOLDER,
  createTraitementDriveFolder,
  driveFolderBrowseUrl,
  ensureChildFolder,
  findChildFolderByName,
  getDriveApiForUser,
  listFilesInFolder,
  uploadFileToRegistreFolder,
} from "./drive";
import {
  getTraitementDataTemplateUrl,
  TRAITEMENT_TEMPLATE_DRIVE_FILENAME,
} from "./traitement-data-constants";
import {
  decryptTraitementDataRow,
  encryptTraitementDataField,
} from "./traitement-data-crypto";
import type { RegistreUser, TraitementDataDto } from "./types";

function templateDownloadCandidates(baseUrl: string): string[] {
  const trimmed = baseUrl.replace(/\/$/, "");
  const idMatch = trimmed.match(/\/document\/(\d+)\/?$/);
  const id = idMatch?.[1];
  const candidates = [trimmed];
  if (id) {
    candidates.push(`${trimmed}/download`, `${trimmed}/file`, `/document/download/${id}`);
    try {
      const origin = new URL(trimmed).origin;
      candidates.push(`${origin}/document/download/${id}`);
    } catch {
      /* ignore */
    }
  }
  return [...new Set(candidates)];
}

async function fetchTemplateBuffer(
  templateUrl: string,
): Promise<{ buffer: Buffer; mimeType: string } | { error: string }> {
  for (const url of templateDownloadCandidates(templateUrl)) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") ?? "";
      if (
        contentType.includes("application/pdf") ||
        contentType.includes("octet-stream") ||
        contentType.includes("msword") ||
        contentType.includes("wordprocessingml")
      ) {
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length > 0) {
          return { buffer, mimeType: contentType.split(";")[0]?.trim() || "application/pdf" };
        }
      }
    } catch {
      continue;
    }
  }
  return {
    error:
      "Impossible de récupérer automatiquement le modèle KiwiX. Téléchargez-le depuis KiwiX puis importez la fiche PDF.",
  };
}

function mapUser(u: { id: string; name: string | null; email: string }): RegistreUser {
  return { id: u.id, name: u.name, email: u.email };
}

function serializeRow(
  row: typeof traitementData.$inferSelect,
  u: RegistreUser,
): TraitementDataDto {
  const decrypted = decryptTraitementDataRow(row);
  return {
    id: decrypted.id,
    userId: decrypted.userId,
    nomTraitement: decrypted.nomTraitement,
    reference: decrypted.reference,
    descriptionFinalite: decrypted.descriptionFinalite,
    dateCreationFiche: decrypted.dateCreationFiche?.toISOString() ?? null,
    dateMiseAJourFiche: decrypted.dateMiseAJourFiche?.toISOString() ?? null,
    driveFolderUrl: decrypted.driveFolderUrl,
    fichePdfUrl: decrypted.fichePdfUrl,
    preuveConsentementUrl: decrypted.preuveConsentementUrl,
    preuveMentionsUrl: decrypted.preuveMentionsUrl,
    createdAt: decrypted.createdAt.toISOString(),
    updatedAt: decrypted.updatedAt.toISOString(),
    user: u,
  };
}

export async function getAllTraitementData(): Promise<TraitementDataDto[]> {
  const rows = await db.select().from(traitementData).orderBy(desc(traitementData.createdAt));
  const users = await db.select({ id: user.id, name: user.name, email: user.email }).from(user);
  const userMap = new Map(users.map((u) => [u.id, mapUser(u)]));
  return rows.map((r) =>
    serializeRow(r, userMap.get(r.userId) ?? { id: r.userId, name: null, email: null }),
  );
}

export async function getTraitementDataById(id: string): Promise<TraitementDataDto | null> {
  const [row] = await db.select().from(traitementData).where(eq(traitementData.id, id)).limit(1);
  if (!row) return null;
  const [u] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, row.userId))
    .limit(1);
  return serializeRow(row, u ? mapUser(u) : { id: row.userId, name: null, email: null });
}

export async function getNextTraitementDataReference(): Promise<string> {
  const rows = await db
    .select({ reference: traitementData.reference })
    .from(traitementData)
    .orderBy(desc(traitementData.createdAt))
    .limit(50);

  let max = 0;
  for (const r of rows) {
    const decrypted = decryptTraitementDataRow({ reference: r.reference });
    const n = Number.parseInt(decrypted.reference ?? "", 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return String(max + 1).padStart(3, "0");
}

export async function createTraitementData(
  userId: string,
  data: {
    nomTraitement: string;
    descriptionFinalite?: string | null;
  },
): Promise<TraitementDataDto | { error: string }> {
  const reference = await getNextTraitementDataReference();
  const id = crypto.randomUUID();
  const folderName = `Traitement_${reference}_${data.nomTraitement}`;

  let driveFolderUrl: string | null = null;
  const driveRes = await createTraitementDriveFolder(userId, folderName);
  if (driveRes.ok) driveFolderUrl = driveRes.folderUrl;

  const now = new Date();
  const rows = await db
    .insert(traitementData)
    .values({
      id,
      userId,
      nomTraitement: encryptTraitementDataField(data.nomTraitement) ?? data.nomTraitement,
      reference: encryptTraitementDataField(reference) ?? reference,
      descriptionFinalite: data.descriptionFinalite
        ? (encryptTraitementDataField(data.descriptionFinalite) ?? data.descriptionFinalite)
        : null,
      dateCreationFiche: now,
      dateMiseAJourFiche: now,
      driveFolderUrl,
    })
    .returning();
  const row = rows[0];
  if (!row) return { error: "insert_failed" };

  const [u] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return serializeRow(row, u ? mapUser(u) : { id: userId, name: null, email: null });
}

export async function updateTraitementData(
  id: string,
  patch: Record<string, unknown>,
): Promise<TraitementDataDto | null> {
  const encPatch: Record<string, unknown> = { dateMiseAJourFiche: new Date() };

  if (typeof patch.nomTraitement === "string") {
    encPatch.nomTraitement = encryptTraitementDataField(patch.nomTraitement) ?? patch.nomTraitement;
  }
  if (patch.descriptionFinalite === null) {
    encPatch.descriptionFinalite = null;
  } else if (typeof patch.descriptionFinalite === "string") {
    encPatch.descriptionFinalite =
      encryptTraitementDataField(patch.descriptionFinalite) ?? patch.descriptionFinalite;
  }
  if (patch.driveFolderUrl === null || typeof patch.driveFolderUrl === "string") {
    encPatch.driveFolderUrl = patch.driveFolderUrl;
  }
  if (patch.fichePdfUrl === null || typeof patch.fichePdfUrl === "string") {
    encPatch.fichePdfUrl = patch.fichePdfUrl;
  }
  if (patch.preuveConsentementUrl === null || typeof patch.preuveConsentementUrl === "string") {
    encPatch.preuveConsentementUrl = patch.preuveConsentementUrl;
  }
  if (patch.preuveMentionsUrl === null || typeof patch.preuveMentionsUrl === "string") {
    encPatch.preuveMentionsUrl = patch.preuveMentionsUrl;
  }

  await db.update(traitementData).set(encPatch).where(eq(traitementData.id, id));
  return getTraitementDataById(id);
}

export async function deleteTraitementData(id: string): Promise<boolean> {
  const r = await db
    .delete(traitementData)
    .where(eq(traitementData.id, id))
    .returning({ id: traitementData.id });
  return r.length > 0;
}

export async function uploadTraitementPreuve(
  userId: string,
  id: string,
  type: "consentement" | "mentions",
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<TraitementDataDto | { error: string }> {
  const existing = await getTraitementDataById(id);
  if (!existing?.driveFolderUrl) return { error: "Dossier Drive introuvable pour ce traitement." };

  const driveRes = await getDriveApiForUser(userId);
  if (!driveRes.ok) return { error: driveRes.message };

  const folderId = existing.driveFolderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1];
  if (!folderId) return { error: "URL dossier Drive invalide." };

  const preuvesId = await ensureChildFolder(driveRes.api, folderId, PREUVES_RGPD_FOLDER);
  const subName = type === "consentement" ? PREUVE_CONSENTEMENT_FOLDER : PREUVE_MENTIONS_FOLDER;
  const targetId = await ensureChildFolder(driveRes.api, preuvesId, subName);

  const upload = await uploadFileToRegistreFolder(userId, driveFolderBrowseUrl(targetId), file);
  if (!upload.ok) return { error: upload.message };

  const patch =
    type === "consentement"
      ? { preuveConsentementUrl: upload.webViewLink }
      : { preuveMentionsUrl: upload.webViewLink };

  const updated = await updateTraitementData(id, patch);
  return updated ?? { error: "Mise à jour échouée." };
}

export async function scanTraitementDrivePreuves(
  userId: string,
  id: string,
): Promise<TraitementDataDto | { error: string }> {
  const existing = await getTraitementDataById(id);
  if (!existing?.driveFolderUrl) return { error: "Dossier Drive introuvable." };

  const driveRes = await getDriveApiForUser(userId);
  if (!driveRes.ok) return { error: driveRes.message };

  const folderId = existing.driveFolderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1];
  if (!folderId) return { error: "URL dossier invalide." };

  const preuvesId = await findChildFolderByName(driveRes.api, folderId, PREUVES_RGPD_FOLDER);
  if (!preuvesId) return { error: "Dossier Preuves_RGPD introuvable." };

  const consentId = await findChildFolderByName(driveRes.api, preuvesId, PREUVE_CONSENTEMENT_FOLDER);
  const mentionsId = await findChildFolderByName(driveRes.api, preuvesId, PREUVE_MENTIONS_FOLDER);

  const patch: Record<string, string | null> = {};
  if (consentId) {
    const files = await listFilesInFolder(driveRes.api, consentId);
    patch.preuveConsentementUrl = files[0]?.webViewLink ?? null;
  }
  if (mentionsId) {
    const files = await listFilesInFolder(driveRes.api, mentionsId);
    patch.preuveMentionsUrl = files[0]?.webViewLink ?? null;
  }

  const updated = await updateTraitementData(id, patch);
  return updated ?? { error: "Scan échoué." };
}

export async function uploadTraitementPdf(
  userId: string,
  id: string,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<TraitementDataDto | { error: string }> {
  const existing = await getTraitementDataById(id);
  if (!existing?.driveFolderUrl) return { error: "Dossier Drive introuvable." };

  const upload = await uploadFileToRegistreFolder(userId, existing.driveFolderUrl, file);
  if (!upload.ok) return { error: upload.message };

  const updated = await updateTraitementData(id, { fichePdfUrl: upload.webViewLink });
  return updated ?? { error: "Mise à jour échouée." };
}

export async function depositTraitementTemplate(
  userId: string,
  id: string,
): Promise<
  | { traitement: TraitementDataDto; templateFileUrl: string; templateSourceUrl: string }
  | { error: string; templateSourceUrl: string }
> {
  const templateSourceUrl = getTraitementDataTemplateUrl();
  const existing = await getTraitementDataById(id);
  if (!existing?.driveFolderUrl) {
    return { error: "Dossier Drive introuvable pour ce traitement.", templateSourceUrl };
  }

  const fetched = await fetchTemplateBuffer(templateSourceUrl);
  if ("error" in fetched) {
    return { error: fetched.error, templateSourceUrl };
  }

  const upload = await uploadFileToRegistreFolder(userId, existing.driveFolderUrl, {
    name: TRAITEMENT_TEMPLATE_DRIVE_FILENAME,
    mimeType: fetched.mimeType,
    buffer: fetched.buffer,
  });
  if (!upload.ok) return { error: upload.message, templateSourceUrl };

  const patch: Record<string, string | null> = {};
  if (!existing.fichePdfUrl && upload.webViewLink) {
    patch.fichePdfUrl = upload.webViewLink;
  }

  const traitement =
    Object.keys(patch).length > 0
      ? await updateTraitementData(id, patch)
      : existing;

  if (!traitement) return { error: "Mise à jour échouée.", templateSourceUrl };

  return {
    traitement,
    templateFileUrl: upload.webViewLink ?? existing.driveFolderUrl,
    templateSourceUrl,
  };
}
