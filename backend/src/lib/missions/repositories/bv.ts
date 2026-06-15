import { desc, eq } from "drizzle-orm";

import { db } from "../../../db";
import { missionBv } from "../../../db/schema";
import type { MissionBv, MissionBvInsert } from "../../../types/missions";

export async function getBvById(id: string): Promise<MissionBv | undefined> {
  const [row] = await db.select().from(missionBv).where(eq(missionBv.id, id));
  return row;
}

export async function listBvByBc(bcId: string): Promise<MissionBv[]> {
  return db
    .select()
    .from(missionBv)
    .where(eq(missionBv.bcId, bcId))
    .orderBy(desc(missionBv.createdAt));
}

export async function createBv(values: MissionBvInsert): Promise<MissionBv> {
  const result = await db.insert(missionBv).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer le BV.");
  }
  return row;
}

export async function updateBv(
  id: string,
  values: Partial<MissionBvInsert>,
): Promise<MissionBv | undefined> {
  const result = await db
    .update(missionBv)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(missionBv.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function deleteBv(id: string): Promise<MissionBv | undefined> {
  const result = await db.delete(missionBv).where(eq(missionBv.id, id)).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}
