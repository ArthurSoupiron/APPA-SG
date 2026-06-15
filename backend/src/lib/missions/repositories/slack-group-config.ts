import { db } from "../../../db";
import { missionSlackGroupConfig } from "../../../db/schema";

export async function listMissionSlackGroupConfigIds(): Promise<string[]> {
  const rows = await db
    .select({ groupId: missionSlackGroupConfig.groupId })
    .from(missionSlackGroupConfig);
  return rows.map((row) => row.groupId);
}

export async function replaceMissionSlackGroupConfigIds(groupIds: string[]): Promise<void> {
  await db.delete(missionSlackGroupConfig);
  const uniqueIds = [...new Set(groupIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;
  await db.insert(missionSlackGroupConfig).values(
    uniqueIds.map((groupId) => ({
      groupId,
      updatedAt: new Date(),
    })),
  );
}
