import { desc, eq } from "drizzle-orm";

import { db } from "../../../db";
import { missionPvrf } from "../../../db/schema";
import type { MissionPvrf, MissionPvrfInsert } from "../../../types/missions";

export async function getPvrfById(id: string): Promise<MissionPvrf | undefined> {
  const [row] = await db.select().from(missionPvrf).where(eq(missionPvrf.id, id));
  return row;
}

export async function listPvrfByBc(bcId: string): Promise<MissionPvrf[]> {
  return db
    .select()
    .from(missionPvrf)
    .where(eq(missionPvrf.bcId, bcId))
    .orderBy(desc(missionPvrf.createdAt));
}

export async function createPvrf(values: MissionPvrfInsert): Promise<MissionPvrf> {
  const result = await db.insert(missionPvrf).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer le PVRF.");
  }
  return row;
}

export async function updatePvrf(
  id: string,
  values: Partial<MissionPvrfInsert>,
): Promise<MissionPvrf | undefined> {
  const result = await db
    .update(missionPvrf)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(missionPvrf.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function deletePvrf(id: string): Promise<MissionPvrf | undefined> {
  const result = await db.delete(missionPvrf).where(eq(missionPvrf.id, id)).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}
