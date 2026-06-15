import { count, eq } from "drizzle-orm";

import { db } from "../../db";
import {
  missionBonCommande,
  missionBv,
  missionCca,
  missionFa,
  missionFs,
  missionPvrf,
  missionQs,
  missionRmi,
} from "../../db/schema";
import type { MissionsKpi } from "../../types/missions";

export async function getMissionsKpi(): Promise<MissionsKpi> {
  const [
    missionsResult,
    bonCommandesResult,
    rmiResult,
    pvrfResult,
    qsResult,
    faReguleesResult,
    fsReguleesResult,
    bvVersesResult,
  ] = await Promise.all([
    db.select({ n: count() }).from(missionCca),
    db.select({ n: count() }).from(missionBonCommande),
    db.select({ n: count() }).from(missionRmi),
    db.select({ n: count() }).from(missionPvrf),
    db.select({ n: count() }).from(missionQs),
    db.select({ n: count() }).from(missionFa).where(eq(missionFa.regle, true)),
    db.select({ n: count() }).from(missionFs).where(eq(missionFs.regle, true)),
    db.select({ n: count() }).from(missionBv).where(eq(missionBv.verse, true)),
  ]);

  return {
    missions: missionsResult[0]?.n ?? 0,
    bonCommandes: bonCommandesResult[0]?.n ?? 0,
    rmi: rmiResult[0]?.n ?? 0,
    pvrf: pvrfResult[0]?.n ?? 0,
    qs: qsResult[0]?.n ?? 0,
    faReglees: faReguleesResult[0]?.n ?? 0,
    fsReglees: fsReguleesResult[0]?.n ?? 0,
    bvVerses: bvVersesResult[0]?.n ?? 0,
  };
}
