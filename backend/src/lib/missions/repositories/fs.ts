import { desc, eq } from "drizzle-orm";

import { db } from "../../../db";
import { missionFs } from "../../../db/schema";
import type { MissionFs, MissionFsInsert } from "../../../types/missions";

export async function getFsById(id: string): Promise<MissionFs | undefined> {
  const [row] = await db.select().from(missionFs).where(eq(missionFs.id, id));
  return row;
}

export async function listFsByBc(bcId: string): Promise<MissionFs[]> {
  return db
    .select()
    .from(missionFs)
    .where(eq(missionFs.bcId, bcId))
    .orderBy(desc(missionFs.createdAt));
}

export async function createFs(values: MissionFsInsert): Promise<MissionFs> {
  const result = await db.insert(missionFs).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer la FS.");
  }
  return row;
}

export async function updateFs(
  id: string,
  values: Partial<MissionFsInsert>,
): Promise<MissionFs | undefined> {
  const result = await db
    .update(missionFs)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(missionFs.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function deleteFs(id: string): Promise<MissionFs | undefined> {
  const result = await db.delete(missionFs).where(eq(missionFs.id, id)).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}
