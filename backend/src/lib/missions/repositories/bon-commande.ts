import { desc, eq } from "drizzle-orm";

import { db } from "../../../db";
import { missionBcDesignation, missionBcFrais, missionBonCommande } from "../../../db/schema";
import type {
  MissionBcDesignation,
  MissionBcDesignationInsert,
  MissionBcFrais,
  MissionBcFraisInsert,
  MissionBonCommande,
  MissionBonCommandeInsert,
} from "../../../types/missions";

export async function getBonCommandeById(id: string): Promise<MissionBonCommande | undefined> {
  const [row] = await db.select().from(missionBonCommande).where(eq(missionBonCommande.id, id));
  return row;
}

export async function listBonCommandeByCca(ccaId: string): Promise<MissionBonCommande[]> {
  return db
    .select()
    .from(missionBonCommande)
    .where(eq(missionBonCommande.ccaId, ccaId))
    .orderBy(desc(missionBonCommande.createdAt));
}

export async function createBonCommande(
  values: MissionBonCommandeInsert,
): Promise<MissionBonCommande> {
  const result = await db.insert(missionBonCommande).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer le bon de commande.");
  }
  return row;
}

export async function updateBonCommande(
  id: string,
  values: Partial<MissionBonCommandeInsert>,
): Promise<MissionBonCommande | undefined> {
  const result = await db
    .update(missionBonCommande)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(missionBonCommande.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function deleteBonCommande(id: string): Promise<MissionBonCommande | undefined> {
  const result = await db.delete(missionBonCommande).where(eq(missionBonCommande.id, id)).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function setBonCommandeReplacement(
  sourceId: string,
  replacedById: string,
): Promise<MissionBonCommande | undefined> {
  const result = await db
    .update(missionBonCommande)
    .set({ replacedById, updatedAt: new Date() })
    .where(eq(missionBonCommande.id, sourceId))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function getBonCommandeDesignationById(
  id: string,
): Promise<MissionBcDesignation | undefined> {
  const [row] = await db
    .select()
    .from(missionBcDesignation)
    .where(eq(missionBcDesignation.id, id));
  return row;
}

export async function listBonCommandeDesignationsByBc(
  bcId: string,
): Promise<MissionBcDesignation[]> {
  return db
    .select()
    .from(missionBcDesignation)
    .where(eq(missionBcDesignation.bcId, bcId))
    .orderBy(desc(missionBcDesignation.createdAt));
}

export async function createBonCommandeDesignation(
  values: MissionBcDesignationInsert,
): Promise<MissionBcDesignation> {
  const result = await db.insert(missionBcDesignation).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer la designation BC.");
  }
  return row;
}

export async function updateBonCommandeDesignation(
  id: string,
  values: Partial<MissionBcDesignationInsert>,
): Promise<MissionBcDesignation | undefined> {
  const result = await db
    .update(missionBcDesignation)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(missionBcDesignation.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function deleteBonCommandeDesignation(
  id: string,
): Promise<MissionBcDesignation | undefined> {
  const result = await db
    .delete(missionBcDesignation)
    .where(eq(missionBcDesignation.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function getBonCommandeFraisById(id: string): Promise<MissionBcFrais | undefined> {
  const [row] = await db.select().from(missionBcFrais).where(eq(missionBcFrais.id, id));
  return row;
}

export async function listBonCommandeFraisByBc(bcId: string): Promise<MissionBcFrais[]> {
  return db
    .select()
    .from(missionBcFrais)
    .where(eq(missionBcFrais.bcId, bcId))
    .orderBy(desc(missionBcFrais.createdAt));
}

export async function createBonCommandeFrais(
  values: MissionBcFraisInsert,
): Promise<MissionBcFrais> {
  const result = await db.insert(missionBcFrais).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer le frais BC.");
  }
  return row;
}

export async function updateBonCommandeFrais(
  id: string,
  values: Partial<MissionBcFraisInsert>,
): Promise<MissionBcFrais | undefined> {
  const result = await db
    .update(missionBcFrais)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(missionBcFrais.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function deleteBonCommandeFrais(id: string): Promise<MissionBcFrais | undefined> {
  const result = await db.delete(missionBcFrais).where(eq(missionBcFrais.id, id)).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}
