import { eq } from "drizzle-orm";

import { db } from "../../db";
import {
  registreBdd,
  registreLicences,
  registreRgpd,
  traitementData,
  user,
} from "../../db/schema";
import { createRegistreDriveFolder } from "./drive";
import type { RegistreDto, RegistreType, RegistreUser } from "./types";

function toIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString();
}

function mapUser(u: { id: string; name: string | null; email: string }): RegistreUser {
  return { id: u.id, name: u.name, email: u.email };
}

async function enrichBdd(
  rows: (typeof registreBdd.$inferSelect)[],
  users: Map<string, RegistreUser>,
): Promise<RegistreDto[]> {
  const out: RegistreDto[] = [];
  for (const r of rows) {
    let traitementDataNom: string | null = null;
    if (r.traitementDataId) {
      const [td] = await db
        .select({ nomTraitement: traitementData.nomTraitement })
        .from(traitementData)
        .where(eq(traitementData.id, r.traitementDataId))
        .limit(1);
      traitementDataNom = td?.nomTraitement ?? null;
    }
    out.push({
      type: "bdd",
      id: r.id,
      userId: r.userId,
      anneeCivile: r.anneeCivile,
      nom: r.nom,
      driveFolderUrl: r.driveFolderUrl,
      traitementDataId: r.traitementDataId,
      sheetExcelUrl: r.sheetExcelUrl,
      traitementDataNom,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      user: users.get(r.userId) ?? { id: r.userId, name: null, email: null },
    });
  }
  return out;
}

export async function getAllRegistres(): Promise<RegistreDto[]> {
  const users = await db.select({ id: user.id, name: user.name, email: user.email }).from(user);
  const userMap = new Map(users.map((u) => [u.id, mapUser(u)]));

  const [rgpdRows, licencesRows, bddRows] = await Promise.all([
    db.select().from(registreRgpd),
    db.select().from(registreLicences),
    db.select().from(registreBdd),
  ]);

  const rgpd: RegistreDto[] = rgpdRows.map((r) => ({
    type: "rgpd",
    id: r.id,
    userId: r.userId,
    anneeCivile: r.anneeCivile,
    nom: r.nom,
    driveFolderUrl: r.driveFolderUrl,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    user: userMap.get(r.userId) ?? { id: r.userId, name: null, email: null },
  }));

  const licences: RegistreDto[] = licencesRows.map((r) => ({
    type: "licences",
    id: r.id,
    userId: r.userId,
    anneeCivile: r.anneeCivile,
    nom: r.nom,
    driveFolderUrl: r.driveFolderUrl,
    dateFacturation: toIso(r.dateFacturation),
    utilisationCommerciale: r.utilisationCommerciale ?? false,
    licenceCommercialeUrl: r.licenceCommercialeUrl,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    user: userMap.get(r.userId) ?? { id: r.userId, name: null, email: null },
  }));

  const bdd = await enrichBdd(bddRows, userMap);
  return [...rgpd, ...licences, ...bdd];
}

export async function searchRegistres(query: string, type?: RegistreType): Promise<RegistreDto[]> {
  const all = await getAllRegistres();
  const q = query.trim().toLowerCase();
  return all.filter((r) => {
    if (type && r.type !== type) return false;
    if (!q) return true;
    return (
      r.nom.toLowerCase().includes(q) ||
      String(r.anneeCivile).includes(q) ||
      (r.type === "bdd" && (r.traitementDataNom?.toLowerCase().includes(q) ?? false))
    );
  });
}

export async function getRegistreById(id: string): Promise<RegistreDto | null> {
  const all = await getAllRegistres();
  return all.find((r) => r.id === id) ?? null;
}

export async function createRegistreRgpd(
  userId: string,
  data: { anneeCivile: number; nom: string },
): Promise<RegistreDto | { error: string }> {
  const id = crypto.randomUUID();
  let driveFolderUrl: string | null = null;
  const driveRes = await createRegistreDriveFolder(userId, "rgpd", data.anneeCivile, data.nom);
  if (driveRes.ok) driveFolderUrl = driveRes.folderUrl;

  const rows = await db
    .insert(registreRgpd)
    .values({
      id,
      userId,
      anneeCivile: data.anneeCivile,
      nom: data.nom,
      driveFolderUrl,
    })
    .returning();
  const row = rows[0];
  if (!row) return { error: "insert_failed" };

  const u = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return {
    type: "rgpd",
    id: row.id,
    userId: row.userId,
    anneeCivile: row.anneeCivile,
    nom: row.nom,
    driveFolderUrl: row.driveFolderUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    user: u[0] ? mapUser(u[0]) : { id: userId, name: null, email: null },
  };
}

export async function createRegistreLicences(
  userId: string,
  data: {
    anneeCivile: number;
    nom: string;
    dateFacturation?: Date | null;
    utilisationCommerciale?: boolean;
    licenceCommercialeUrl?: string | null;
  },
): Promise<RegistreDto | { error: string }> {
  const id = crypto.randomUUID();
  let driveFolderUrl: string | null = null;
  const driveRes = await createRegistreDriveFolder(userId, "licences", data.anneeCivile, data.nom);
  if (driveRes.ok) driveFolderUrl = driveRes.folderUrl;

  const rows = await db
    .insert(registreLicences)
    .values({
      id,
      userId,
      anneeCivile: data.anneeCivile,
      nom: data.nom,
      driveFolderUrl,
      dateFacturation: data.dateFacturation ?? null,
      utilisationCommerciale: data.utilisationCommerciale ?? false,
      licenceCommercialeUrl: data.licenceCommercialeUrl ?? null,
    })
    .returning();
  const row = rows[0];
  if (!row) return { error: "insert_failed" };

  const u = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return {
    type: "licences",
    id: row.id,
    userId: row.userId,
    anneeCivile: row.anneeCivile,
    nom: row.nom,
    driveFolderUrl: row.driveFolderUrl,
    dateFacturation: toIso(row.dateFacturation),
    utilisationCommerciale: row.utilisationCommerciale ?? false,
    licenceCommercialeUrl: row.licenceCommercialeUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    user: u[0] ? mapUser(u[0]) : { id: userId, name: null, email: null },
  };
}

export async function createRegistreBdd(
  userId: string,
  data: {
    anneeCivile: number;
    nom: string;
    traitementDataId?: string | null;
    sheetExcelUrl?: string | null;
  },
): Promise<RegistreDto | { error: string }> {
  const id = crypto.randomUUID();
  const rows = await db
    .insert(registreBdd)
    .values({
      id,
      userId,
      anneeCivile: data.anneeCivile,
      nom: data.nom,
      traitementDataId: data.traitementDataId ?? null,
      sheetExcelUrl: data.sheetExcelUrl ?? null,
    })
    .returning();
  const row = rows[0];
  if (!row) return { error: "insert_failed" };

  const users = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  const userMap = new Map(users.map((u) => [u.id, mapUser(u)]));
  const enriched = await enrichBdd([row], userMap);
  return enriched[0]!;
}

export async function updateRegistre(
  id: string,
  type: RegistreType,
  patch: Record<string, unknown>,
): Promise<RegistreDto | null> {
  if (type === "rgpd") {
    await db
      .update(registreRgpd)
      .set({
        anneeCivile: typeof patch.anneeCivile === "number" ? patch.anneeCivile : undefined,
        nom: typeof patch.nom === "string" ? patch.nom : undefined,
        driveFolderUrl:
          patch.driveFolderUrl === null || typeof patch.driveFolderUrl === "string"
            ? (patch.driveFolderUrl as string | null)
            : undefined,
      })
      .where(eq(registreRgpd.id, id));
  } else if (type === "licences") {
    await db
      .update(registreLicences)
      .set({
        anneeCivile: typeof patch.anneeCivile === "number" ? patch.anneeCivile : undefined,
        nom: typeof patch.nom === "string" ? patch.nom : undefined,
        driveFolderUrl:
          patch.driveFolderUrl === null || typeof patch.driveFolderUrl === "string"
            ? (patch.driveFolderUrl as string | null)
            : undefined,
        dateFacturation:
          patch.dateFacturation === null
            ? null
            : typeof patch.dateFacturation === "string"
              ? new Date(patch.dateFacturation)
              : undefined,
        utilisationCommerciale:
          typeof patch.utilisationCommerciale === "boolean"
            ? patch.utilisationCommerciale
            : undefined,
        licenceCommercialeUrl:
          patch.licenceCommercialeUrl === null || typeof patch.licenceCommercialeUrl === "string"
            ? (patch.licenceCommercialeUrl as string | null)
            : undefined,
      })
      .where(eq(registreLicences.id, id));
  } else {
    await db
      .update(registreBdd)
      .set({
        anneeCivile: typeof patch.anneeCivile === "number" ? patch.anneeCivile : undefined,
        nom: typeof patch.nom === "string" ? patch.nom : undefined,
        traitementDataId:
          patch.traitementDataId === null || typeof patch.traitementDataId === "string"
            ? (patch.traitementDataId as string | null)
            : undefined,
        sheetExcelUrl:
          patch.sheetExcelUrl === null || typeof patch.sheetExcelUrl === "string"
            ? (patch.sheetExcelUrl as string | null)
            : undefined,
      })
      .where(eq(registreBdd.id, id));
  }
  return getRegistreById(id);
}

export async function deleteRegistre(id: string, type: RegistreType): Promise<boolean> {
  if (type === "rgpd") {
    const r = await db.delete(registreRgpd).where(eq(registreRgpd.id, id)).returning({ id: registreRgpd.id });
    return r.length > 0;
  }
  if (type === "licences") {
    const r = await db
      .delete(registreLicences)
      .where(eq(registreLicences.id, id))
      .returning({ id: registreLicences.id });
    return r.length > 0;
  }
  const r = await db.delete(registreBdd).where(eq(registreBdd.id, id)).returning({ id: registreBdd.id });
  return r.length > 0;
}

export async function driveFolderUrlExists(url: string): Promise<boolean> {
  const all = await getAllRegistres();
  if (all.some((r) => r.driveFolderUrl === url)) return true;
  const [td] = await db
    .select({ id: traitementData.id })
    .from(traitementData)
    .where(eq(traitementData.driveFolderUrl, url))
    .limit(1);
  return Boolean(td);
}
