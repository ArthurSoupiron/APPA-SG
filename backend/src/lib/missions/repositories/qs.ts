import { desc, eq } from "drizzle-orm";

import { db } from "../../../db";
import { missionQs } from "../../../db/schema";
import type { MissionQs, MissionQsInsert } from "../../../types/missions";

export async function getQsById(id: string): Promise<MissionQs | undefined> {
  const [row] = await db.select().from(missionQs).where(eq(missionQs.id, id));
  return row;
}

export async function listQsByBc(bcId: string): Promise<MissionQs[]> {
  return db
    .select()
    .from(missionQs)
    .where(eq(missionQs.bcId, bcId))
    .orderBy(desc(missionQs.createdAt));
}

export async function createQs(values: MissionQsInsert): Promise<MissionQs> {
  const result = await db.insert(missionQs).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer le QS.");
  }
  return row;
}

export async function updateQs(
  id: string,
  values: Partial<MissionQsInsert>,
): Promise<MissionQs | undefined> {
  const result = await db
    .update(missionQs)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(missionQs.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function deleteQs(id: string): Promise<MissionQs | undefined> {
  const result = await db.delete(missionQs).where(eq(missionQs.id, id)).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}
