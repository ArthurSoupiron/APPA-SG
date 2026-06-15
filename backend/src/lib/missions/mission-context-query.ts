import { eq } from "drizzle-orm";

import { db } from "../../db";
import { commercialClient, commercialEntreprise, missionCca } from "../../db/schema";
import { user } from "../../db/schema/auth/user";

export type MissionContextData = {
  missionRow: {
    id: string;
    missionName: string;
    startDate: Date | null;
    endDate: Date | null;
    description: string | null;
    driveFolderId: string | null;
    generatedFileId: string | null;
    cdpName: string | null;
  };
  clientName: string;
  entrepriseName: string;
};

export async function getMissionContextQuery(missionId: string): Promise<MissionContextData> {
  const [missionRow] = await db
    .select({
      id: missionCca.id,
      missionName: missionCca.missionName,
      startDate: missionCca.startDate,
      endDate: missionCca.endDate,
      description: missionCca.description,
      driveFolderId: missionCca.driveFolderId,
      generatedFileId: missionCca.generatedFileId,
      clientNom: commercialClient.nomClient,
      clientPrenom: commercialClient.prenomClient,
      entrepriseNom: commercialEntreprise.nomEntreprise,
      cdpName: user.name,
    })
    .from(missionCca)
    .leftJoin(commercialClient, eq(missionCca.clientId, commercialClient.id))
    .leftJoin(commercialEntreprise, eq(missionCca.entrepriseId, commercialEntreprise.id))
    .leftJoin(user, eq(missionCca.cdpId, user.id))
    .where(eq(missionCca.id, missionId))
    .limit(1);

  if (!missionRow) throw new Error("Mission introuvable.");

  const clientName =
    `${missionRow.clientNom ?? ""} ${missionRow.clientPrenom ?? ""}`.trim();
  const entrepriseName = missionRow.entrepriseNom ?? "";

  return {
    missionRow: {
      id: missionRow.id,
      missionName: missionRow.missionName,
      startDate: missionRow.startDate,
      endDate: missionRow.endDate,
      description: missionRow.description,
      driveFolderId: missionRow.driveFolderId,
      generatedFileId: missionRow.generatedFileId,
      cdpName: missionRow.cdpName,
    },
    clientName,
    entrepriseName,
  };
}
