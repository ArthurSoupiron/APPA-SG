import { desc, eq } from "drizzle-orm";

import { db } from "../../../db";
import { missionRmi } from "../../../db/schema";
import type { MissionRmi, MissionRmiInsert } from "../../../types/missions";

export async function getRmiById(id: string): Promise<MissionRmi | undefined> {
  const [row] = await db.select().from(missionRmi).where(eq(missionRmi.id, id));
  return row;
}

export async function listRmiByBc(bcId: string): Promise<MissionRmi[]> {
  return db
    .select()
    .from(missionRmi)
    .where(eq(missionRmi.bcId, bcId))
    .orderBy(desc(missionRmi.createdAt));
}

export async function createRmi(values: MissionRmiInsert): Promise<MissionRmi> {
  const result = await db.insert(missionRmi).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer le RMI.");
  }
  return row;
}

export async function updateRmi(
  id: string,
  values: Partial<MissionRmiInsert>,
): Promise<MissionRmi | undefined> {
  const result = await db
    .update(missionRmi)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(missionRmi.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function deleteRmi(id: string): Promise<MissionRmi | undefined> {
  const result = await db.delete(missionRmi).where(eq(missionRmi.id, id)).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}
