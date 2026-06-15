import { desc, eq } from "drizzle-orm";

import { db } from "../../../db";
import { missionFa } from "../../../db/schema";
import type { MissionFa, MissionFaInsert } from "../../../types/missions";

export async function getFaById(id: string): Promise<MissionFa | undefined> {
  const [row] = await db.select().from(missionFa).where(eq(missionFa.id, id));
  return row;
}

export async function listFaByBc(bcId: string): Promise<MissionFa[]> {
  return db
    .select()
    .from(missionFa)
    .where(eq(missionFa.bcId, bcId))
    .orderBy(desc(missionFa.createdAt));
}

export async function createFa(values: MissionFaInsert): Promise<MissionFa> {
  const result = await db.insert(missionFa).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer la FA.");
  }
  return row;
}

export async function updateFa(
  id: string,
  values: Partial<MissionFaInsert>,
): Promise<MissionFa | undefined> {
  const result = await db
    .update(missionFa)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(missionFa.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function deleteFa(id: string): Promise<MissionFa | undefined> {
  const result = await db.delete(missionFa).where(eq(missionFa.id, id)).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}
