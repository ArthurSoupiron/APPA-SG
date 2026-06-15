import { desc, eq } from "drizzle-orm";

import { db } from "../../../db";
import { missionCca } from "../../../db/schema";
import type { MissionCca, MissionCcaInsert } from "../../../types/missions";

export async function getCcaById(id: string): Promise<MissionCca | undefined> {
  const [row] = await db.select().from(missionCca).where(eq(missionCca.id, id));
  return row;
}

export async function listCcaByClient(clientId: string): Promise<MissionCca[]> {
  return db
    .select()
    .from(missionCca)
    .where(eq(missionCca.clientId, clientId))
    .orderBy(desc(missionCca.createdAt));
}

export async function createCca(values: MissionCcaInsert): Promise<MissionCca> {
  const result = await db.insert(missionCca).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer la CCA.");
  }
  return row;
}

export async function updateCca(
  id: string,
  values: Partial<MissionCcaInsert>,
): Promise<MissionCca | undefined> {
  const result = await db
    .update(missionCca)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(missionCca.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function deleteCca(id: string): Promise<MissionCca | undefined> {
  const result = await db.delete(missionCca).where(eq(missionCca.id, id)).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}
