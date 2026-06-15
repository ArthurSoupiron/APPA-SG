import { desc, eq, inArray } from "drizzle-orm";

import { db } from "../../db";
import {
  missionBcDesignation,
  missionBcFrais,
  missionBonCommande,
  missionBv,
  missionFa,
  missionFs,
  missionPvrf,
  missionQs,
  missionRmi,
} from "../../db/schema";
import type {
  BcWorkflowState,
  DocStageStatus,
  MissionBcDocStages,
  MissionBcDesignation,
  MissionBcFrais,
  MissionBonCommande,
  MissionBv,
  MissionFa,
  MissionFs,
  MissionPvrf,
  MissionQs,
  MissionRmi,
  MissionWorkflowState,
} from "../../types/missions";

export type { DocStageStatus, BcWorkflowState, MissionWorkflowState };

export function multiDocStatus(count: number): DocStageStatus {
  if (count === 0) return "absent";
  return count > 1 ? "avenant" : "present";
}

export function singleDocWithChainStatus(
  row: { replacedById?: string | null } | null,
): DocStageStatus {
  if (!row) return "absent";
  return row.replacedById ? "avenant" : "present";
}

export function singleDocPresent(row: object | null): DocStageStatus {
  return row ? "present" : "absent";
}

export function computeBcDocStages(input: {
  fa: MissionFa | null;
  fs: MissionFs[];
  rmi: MissionRmi | null;
  bv: MissionBv[];
  pvrf: MissionPvrf | null;
  qs: MissionQs | null;
}): MissionBcDocStages {
  return {
    fa: singleDocPresent(input.fa),
    fs: multiDocStatus(input.fs.length),
    rmi: singleDocWithChainStatus(input.rmi),
    bv: multiDocStatus(input.bv.length),
    pvrf: singleDocPresent(input.pvrf),
    qs: singleDocPresent(input.qs),
  };
}

function groupById<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const arr = map.get(k);
    if (arr) arr.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function buildBcWorkflowState(
  bc: MissionBonCommande,
  designations: MissionBcDesignation[],
  frais: MissionBcFrais[],
  faRows: MissionFa[],
  fsRows: MissionFs[],
  rmiRows: MissionRmi[],
  bvRows: MissionBv[],
  pvrfRows: MissionPvrf[],
  qsRows: MissionQs[],
): BcWorkflowState {
  const fa = faRows[0] ?? null;
  const rmi = rmiRows[0] ?? null;
  const pvrf = pvrfRows[0] ?? null;
  const qs = qsRows[0] ?? null;
  return {
    bc,
    designations,
    frais,
    fa,
    fs: fsRows,
    rmi,
    bv: bvRows,
    pvrf,
    qs,
    stages: computeBcDocStages({ fa, fs: fsRows, rmi, bv: bvRows, pvrf, qs }),
  };
}

export async function getWorkflowStateByMission(
  missionId: string,
): Promise<MissionWorkflowState> {
  const bcs = await db
    .select()
    .from(missionBonCommande)
    .where(eq(missionBonCommande.ccaId, missionId))
    .orderBy(missionBonCommande.createdAt);

  const bcsWithState: BcWorkflowState[] = await Promise.all(
    bcs.map((bc) => getWorkflowStateByBc(bc)),
  );

  return { missionId, bcs: bcsWithState };
}

/**
 * Version batch : récupère les états workflow de plusieurs missions en 9 requêtes SQL
 * au lieu de N × 9 (une par mission + une par BC).
 */
export async function getWorkflowStatesByMissions(
  missionIds: string[],
): Promise<MissionWorkflowState[]> {
  if (missionIds.length === 0) return [];

  const allBcs = await db
    .select()
    .from(missionBonCommande)
    .where(inArray(missionBonCommande.ccaId, missionIds))
    .orderBy(missionBonCommande.createdAt);

  if (allBcs.length === 0) {
    return missionIds.map((missionId) => ({ missionId, bcs: [] }));
  }

  const bcIds = allBcs.map((bc) => bc.id);

  const [
    allDesignations,
    allFrais,
    allFa,
    allFs,
    allRmi,
    allBv,
    allPvrf,
    allQs,
  ] = await Promise.all([
    db
      .select()
      .from(missionBcDesignation)
      .where(inArray(missionBcDesignation.bcId, bcIds))
      .orderBy(desc(missionBcDesignation.createdAt)),
    db
      .select()
      .from(missionBcFrais)
      .where(inArray(missionBcFrais.bcId, bcIds))
      .orderBy(desc(missionBcFrais.createdAt)),
    db
      .select()
      .from(missionFa)
      .where(inArray(missionFa.bcId, bcIds))
      .orderBy(desc(missionFa.createdAt)),
    db
      .select()
      .from(missionFs)
      .where(inArray(missionFs.bcId, bcIds))
      .orderBy(desc(missionFs.createdAt)),
    db
      .select()
      .from(missionRmi)
      .where(inArray(missionRmi.bcId, bcIds))
      .orderBy(desc(missionRmi.createdAt)),
    db
      .select()
      .from(missionBv)
      .where(inArray(missionBv.bcId, bcIds))
      .orderBy(desc(missionBv.createdAt)),
    db
      .select()
      .from(missionPvrf)
      .where(inArray(missionPvrf.bcId, bcIds))
      .orderBy(desc(missionPvrf.createdAt)),
    db
      .select()
      .from(missionQs)
      .where(inArray(missionQs.bcId, bcIds))
      .orderBy(desc(missionQs.createdAt)),
  ]);

  const designationsByBc = groupById(allDesignations, (d) => d.bcId);
  const fraisByBc = groupById(allFrais, (f) => f.bcId);
  const faByBc = groupById(allFa, (fa) => fa.bcId);
  const fsByBc = groupById(allFs, (fs) => fs.bcId);
  const rmiByBc = groupById(allRmi, (rmi) => rmi.bcId);
  const bvByBc = groupById(allBv, (bv) => bv.bcId);
  const pvrfByBc = groupById(allPvrf, (pvrf) => pvrf.bcId);
  const qsByBc = groupById(allQs, (qs) => qs.bcId);
  const bcsByMission = groupById(allBcs, (bc) => bc.ccaId);

  return missionIds.map((missionId) => {
    const missionBcs = bcsByMission.get(missionId) ?? [];
    const bcsWithState: BcWorkflowState[] = missionBcs.map((bc) =>
      buildBcWorkflowState(
        bc,
        designationsByBc.get(bc.id) ?? [],
        fraisByBc.get(bc.id) ?? [],
        faByBc.get(bc.id) ?? [],
        fsByBc.get(bc.id) ?? [],
        rmiByBc.get(bc.id) ?? [],
        bvByBc.get(bc.id) ?? [],
        pvrfByBc.get(bc.id) ?? [],
        qsByBc.get(bc.id) ?? [],
      ),
    );
    return { missionId, bcs: bcsWithState };
  });
}

export async function getWorkflowStateByBc(bc: MissionBonCommande): Promise<BcWorkflowState> {
  const [faRows, designationRows, fraisRows, fsRows, rmiRows, bvRows, pvrfRows, qsRows] =
    await Promise.all([
      db
        .select()
        .from(missionFa)
        .where(eq(missionFa.bcId, bc.id))
        .orderBy(desc(missionFa.createdAt)),
      db
        .select()
        .from(missionBcDesignation)
        .where(eq(missionBcDesignation.bcId, bc.id))
        .orderBy(desc(missionBcDesignation.createdAt)),
      db
        .select()
        .from(missionBcFrais)
        .where(eq(missionBcFrais.bcId, bc.id))
        .orderBy(desc(missionBcFrais.createdAt)),
      db
        .select()
        .from(missionFs)
        .where(eq(missionFs.bcId, bc.id))
        .orderBy(desc(missionFs.createdAt)),
      db
        .select()
        .from(missionRmi)
        .where(eq(missionRmi.bcId, bc.id))
        .orderBy(desc(missionRmi.createdAt)),
      db
        .select()
        .from(missionBv)
        .where(eq(missionBv.bcId, bc.id))
        .orderBy(desc(missionBv.createdAt)),
      db
        .select()
        .from(missionPvrf)
        .where(eq(missionPvrf.bcId, bc.id))
        .orderBy(desc(missionPvrf.createdAt)),
      db
        .select()
        .from(missionQs)
        .where(eq(missionQs.bcId, bc.id))
        .orderBy(desc(missionQs.createdAt)),
    ]);

  return buildBcWorkflowState(
    bc,
    designationRows,
    fraisRows,
    faRows,
    fsRows,
    rmiRows,
    bvRows,
    pvrfRows,
    qsRows,
  );
}
