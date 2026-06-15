import { eq } from "drizzle-orm";

import { db } from "../../db";
import { user } from "../../db/schema/auth/user";
import type {
  MissionBvInsert,
  MissionFaInsert,
  MissionFsInsert,
  MissionPvrfInsert,
  MissionQsInsert,
  MissionRmiInsert,
} from "../../types/missions";
import {
  appendMissionDocumentEvent,
  createBcRevision,
  createBvRevision,
  createFaRevision,
  createFsRevision,
  createPvrfRevision,
  createQsRevision,
  createRmiRevision,
  listBcRevisions,
  listBvRevisions,
  listFaRevisions,
  listFsRevisions,
  listPvrfRevisions,
  listQsRevisions,
  listRmiRevisions,
} from "./audit-service";
import { getDesignationTotalHtStr } from "./mission-money";
import { syncMissionAgendaMilestones } from "./mission-agenda-sync";
import {
  createBonCommande,
  createBonCommandeDesignation,
  createBonCommandeFrais,
  deleteBonCommandeDesignation,
  deleteBonCommandeFrais,
  getBonCommandeById,
  getBonCommandeDesignationById,
  listBonCommandeDesignationsByBc,
  listBonCommandeFraisByBc,
  updateBonCommande,
  updateBonCommandeDesignation,
  updateBonCommandeFrais,
} from "./repositories/bon-commande";
import { createBv as createBvRepo, updateBv } from "./repositories/bv";
import { createFa as createFaRepo, updateFa } from "./repositories/fa";
import { createFs as createFsRepo, updateFs } from "./repositories/fs";
import { createPvrf as createPvrfRepo, updatePvrf } from "./repositories/pvrf";
import { createQs as createQsRepo, updateQs } from "./repositories/qs";
import { createRmi as createRmiRepo, updateRmi } from "./repositories/rmi";
import { createRmiAssignation } from "./repositories/rmi-assignation";

export class MissionMutationError extends Error {
  constructor(
    message: string,
    readonly code: "not_found" | "forbidden" | "validation" = "validation",
  ) {
    super(message);
    this.name = "MissionMutationError";
  }
}

async function requireBcOwnership(missionId: string, bcId: string): Promise<void> {
  const bc = await getBonCommandeById(bcId);
  if (!bc || bc.ccaId !== missionId) {
    throw new MissionMutationError(
      "Accès refusé : BC introuvable pour cette mission.",
      "forbidden",
    );
  }
}

async function createOrUpdateDocRevision(params: {
  missionId: string;
  bcId: string;
  entityType: "fa" | "fs" | "rmi" | "bv" | "pvrf" | "qs";
  entityId: string;
  changeType: "create" | "update" | "avenant";
  revisionNumber: number;
  label: string;
  changedBy: string;
}) {
  const eventType =
    params.changeType === "create"
      ? (`${params.entityType}_created` as const)
      : params.changeType === "avenant"
        ? (`${params.entityType}_avenant` as const)
        : (`${params.entityType}_updated` as const);
  await appendMissionDocumentEvent({
    missionId: params.missionId,
    bcId: params.bcId,
    entityType: params.entityType,
    entityId: params.entityId,
    eventType,
    revisionNumber: params.revisionNumber,
    label: params.label,
    changedBy: params.changedBy,
  });
}

export async function createBc(
  missionId: string,
  userId: string,
  data: {
    bcNumber: string;
    livreDate?: Date | null;
    designations?: Array<{
      titre: string;
      description?: string | null;
      nbJeh?: number | null;
      montantJeh?: string | null;
      prixTotalHt?: string | null;
      tva?: string | null;
      totalTtc?: string | null;
    }>;
    frais?: Array<{
      texte: string;
      montantHt?: string | null;
      tva?: string | null;
      totalTtc?: string | null;
    }>;
  },
): Promise<void> {
  const bc = await createBonCommande({
    id: crypto.randomUUID(),
    ccaId: missionId,
    bcNumber: data.bcNumber,
    type: "BC",
    livre: false,
    createdBy: userId,
  });
  const designations = (data.designations ?? []).filter((d) => d.titre.trim().length > 0);
  for (const [index, designation] of designations.entries()) {
    await createBonCommandeDesignation({
      id: crypto.randomUUID(),
      bcId: bc.id,
      titre: designation.titre.trim(),
      description: designation.description?.trim() || null,
      nbJeh: designation.nbJeh ?? null,
      montantJeh: designation.montantJeh ?? null,
      prixTotalHt: getDesignationTotalHtStr(designation),
      tva: designation.tva ?? null,
      totalTtc: designation.totalTtc ?? null,
      order: index,
    });
  }
  const frais = (data.frais ?? []).filter((f) => f.texte.trim().length > 0);
  for (const [index, fraisItem] of frais.entries()) {
    await createBonCommandeFrais({
      id: crypto.randomUUID(),
      bcId: bc.id,
      texte: fraisItem.texte.trim(),
      montantHt: fraisItem.montantHt ?? null,
      tva: fraisItem.tva ?? null,
      totalTtc: fraisItem.totalTtc ?? null,
      order: index,
    });
  }
  await createBcRevision(bc.id, "create", bc, userId, "Création du BC");
  await appendMissionDocumentEvent({
    missionId,
    bcId: bc.id,
    entityType: "bc",
    entityId: bc.id,
    eventType: "bc_created",
    revisionNumber: 1,
    label: `BC créé : ${bc.bcNumber}`,
    changedBy: userId,
  });
  await syncMissionAgendaMilestones(missionId, userId);
}

export async function updateBcStructure(
  missionId: string,
  bcId: string,
  userId: string,
  data: {
    bcNumber: string;
    designations: Array<{
      id?: string;
      titre: string;
      description?: string | null;
      nbJeh?: number | null;
      montantJeh?: string | null;
      prixTotalHt?: string | null;
      tva?: string | null;
      totalTtc?: string | null;
    }>;
    frais: Array<{
      id?: string;
      texte: string;
      montantHt?: string | null;
      tva?: string | null;
      totalTtc?: string | null;
    }>;
  },
): Promise<void> {
  const previousBc = await getBonCommandeById(bcId);
  if (!previousBc || previousBc.ccaId !== missionId) {
    throw new MissionMutationError("BC introuvable pour cette mission.", "not_found");
  }
  const updated = await updateBonCommande(bcId, {
    bcNumber: data.bcNumber.trim(),
    updatedBy: userId,
  });
  if (!updated) throw new MissionMutationError("BC introuvable.", "not_found");

  const existingDesignations = await listBonCommandeDesignationsByBc(bcId);
  const existingDesignationIds = new Set(existingDesignations.map((d) => d.id));
  const incomingDesignationIds = new Set(
    data.designations.map((d) => d.id).filter((id): id is string => Boolean(id)),
  );
  for (const designation of data.designations.filter((d) => d.titre.trim().length > 0)) {
    if (designation.id && existingDesignationIds.has(designation.id)) {
      await updateBonCommandeDesignation(designation.id, {
        titre: designation.titre.trim(),
        description: designation.description?.trim() || null,
        nbJeh: designation.nbJeh ?? null,
        montantJeh: designation.montantJeh ?? null,
        prixTotalHt: getDesignationTotalHtStr(designation),
        tva: designation.tva ?? null,
        totalTtc: designation.totalTtc ?? null,
      });
    } else {
      await createBonCommandeDesignation({
        id: crypto.randomUUID(),
        bcId,
        titre: designation.titre.trim(),
        description: designation.description?.trim() || null,
        nbJeh: designation.nbJeh ?? null,
        montantJeh: designation.montantJeh ?? null,
        prixTotalHt: getDesignationTotalHtStr(designation),
        tva: designation.tva ?? null,
        totalTtc: designation.totalTtc ?? null,
      });
    }
  }
  for (const previous of existingDesignations) {
    if (!incomingDesignationIds.has(previous.id)) {
      await deleteBonCommandeDesignation(previous.id);
    }
  }

  const existingFrais = await listBonCommandeFraisByBc(bcId);
  const existingFraisIds = new Set(existingFrais.map((f) => f.id));
  const incomingFraisIds = new Set(
    data.frais.map((f) => f.id).filter((id): id is string => Boolean(id)),
  );
  for (const frais of data.frais.filter((f) => f.texte.trim().length > 0)) {
    if (frais.id && existingFraisIds.has(frais.id)) {
      await updateBonCommandeFrais(frais.id, {
        texte: frais.texte.trim(),
        montantHt: frais.montantHt ?? null,
        tva: frais.tva ?? null,
        totalTtc: frais.totalTtc ?? null,
      });
    } else {
      await createBonCommandeFrais({
        id: crypto.randomUUID(),
        bcId,
        texte: frais.texte.trim(),
        montantHt: frais.montantHt ?? null,
        tva: frais.tva ?? null,
        totalTtc: frais.totalTtc ?? null,
      });
    }
  }
  for (const previous of existingFrais) {
    if (!incomingFraisIds.has(previous.id)) {
      await deleteBonCommandeFrais(previous.id);
    }
  }

  const revisions = await listBcRevisions(bcId);
  await createBcRevision(
    bcId,
    "avenant",
    { bcNumber: updated.bcNumber, designations: data.designations, frais: data.frais },
    userId,
    "Modification BC + designations/frais",
  );
  await appendMissionDocumentEvent({
    missionId,
    bcId,
    entityType: "bc",
    entityId: bcId,
    eventType: "bc_avenant",
    revisionNumber: revisions.length + 1,
    label: `BC amendé : ${updated.bcNumber}`,
    changedBy: userId,
  });
  await syncMissionAgendaMilestones(missionId, userId);
}

export async function assignDesignationIntervenant(
  missionId: string,
  bcId: string,
  designationId: string,
  intervenantId: string | null,
  userId: string,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const before = await getBonCommandeDesignationById(designationId);
  if (!before) throw new MissionMutationError("Désignation introuvable.", "not_found");
  await updateBonCommandeDesignation(designationId, { intervenantId });
  const intervenant =
    intervenantId === null
      ? null
      : await db
          .select({ name: user.name, email: user.email })
          .from(user)
          .where(eq(user.id, intervenantId))
          .limit(1)
          .then((rows) => rows[0]);
  await appendMissionDocumentEvent({
    missionId,
    bcId,
    entityType: "bc",
    entityId: designationId,
    eventType: "bc_updated",
    label: `Assignation intervenant (${before.titre}) : ${intervenant?.name ?? intervenant?.email ?? "Aucun"}`,
    changedBy: userId,
  });
}

export async function updateBc(
  missionId: string,
  bcId: string,
  userId: string,
  data: Partial<{
    bcNumber: string;
    livre: boolean;
    planningDate: Date | null;
    planningEndDate: Date | null;
  }>,
  reason?: string,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const updated = await updateBonCommande(bcId, { ...data, updatedBy: userId });
  if (!updated) throw new MissionMutationError("BC introuvable.", "not_found");
  const revisions = await listBcRevisions(bcId);
  const changeType = revisions.length >= 1 ? "avenant" : "update";
  await createBcRevision(bcId, changeType, updated, userId, reason);
  await appendMissionDocumentEvent({
    missionId,
    bcId,
    entityType: "bc",
    entityId: bcId,
    eventType: changeType === "avenant" ? "bc_avenant" : "bc_updated",
    revisionNumber: revisions.length + 1,
    label: `BC ${changeType === "avenant" ? "amendé" : "mis à jour"} : ${updated.bcNumber}`,
    changedBy: userId,
  });
  await syncMissionAgendaMilestones(missionId, userId);
}

export async function createFa(
  missionId: string,
  bcId: string,
  userId: string,
  data: Omit<MissionFaInsert, "id" | "bcId" | "createdBy">,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const fa = await createFaRepo({
    id: crypto.randomUUID(),
    bcId,
    createdBy: userId,
    ...data,
  });
  await createFaRevision(fa.id, "create", fa, userId, "Création FA");
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "fa",
    entityId: fa.id,
    changeType: "create",
    revisionNumber: 1,
    label: `FA créée : ${fa.faNumber}`,
    changedBy: userId,
  });
}

export async function updateFaDoc(
  missionId: string,
  bcId: string,
  faId: string,
  userId: string,
  data: Partial<Omit<MissionFaInsert, "id" | "bcId" | "createdBy">>,
  reason?: string,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const updated = await updateFa(faId, { ...data, updatedBy: userId });
  if (!updated) throw new MissionMutationError("FA introuvable.", "not_found");
  const revs = await listFaRevisions(faId);
  const changeType = revs.length >= 1 ? "avenant" : "update";
  await createFaRevision(faId, changeType, updated, userId, reason);
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "fa",
    entityId: faId,
    changeType,
    revisionNumber: revs.length + 1,
    label: `FA ${changeType === "avenant" ? "amendée" : "mise à jour"} : ${updated.faNumber}`,
    changedBy: userId,
  });
}

export async function createFs(
  missionId: string,
  bcId: string,
  userId: string,
  data: Omit<MissionFsInsert, "id" | "bcId" | "createdBy">,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const fs = await createFsRepo({
    id: crypto.randomUUID(),
    bcId,
    createdBy: userId,
    ...data,
  });
  await createFsRevision(fs.id, "create", fs, userId, "Création FS");
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "fs",
    entityId: fs.id,
    changeType: "create",
    revisionNumber: 1,
    label: `FS créée : ${fs.fsNumber}`,
    changedBy: userId,
  });
}

export async function updateFsDoc(
  missionId: string,
  bcId: string,
  fsId: string,
  userId: string,
  data: Partial<Omit<MissionFsInsert, "id" | "bcId" | "createdBy">>,
  reason?: string,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const updated = await updateFs(fsId, { ...data, updatedBy: userId });
  if (!updated) throw new MissionMutationError("FS introuvable.", "not_found");
  const revs = await listFsRevisions(fsId);
  const changeType = revs.length >= 1 ? "avenant" : "update";
  await createFsRevision(fsId, changeType, updated, userId, reason);
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "fs",
    entityId: fsId,
    changeType,
    revisionNumber: revs.length + 1,
    label: `FS ${changeType === "avenant" ? "amendée" : "mise à jour"} : ${updated.fsNumber}`,
    changedBy: userId,
  });
}

export async function createRmiDoc(
  missionId: string,
  bcId: string,
  userId: string,
  data: Omit<MissionRmiInsert, "id" | "bcId" | "createdBy">,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const rmi = await createRmiRepo({
    id: crypto.randomUUID(),
    bcId,
    createdBy: userId,
    ...data,
  });
  await createRmiRevision(rmi.id, "create", rmi, userId, "Création RMI");
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "rmi",
    entityId: rmi.id,
    changeType: "create",
    revisionNumber: 1,
    label: `RMI créé : ${rmi.rmiNumber}`,
    changedBy: userId,
  });
  await syncMissionAgendaMilestones(missionId, userId);
}

export async function createRmiPerIntervenant(
  missionId: string,
  bcId: string,
  userId: string,
  baseNumber: string,
): Promise<{ created: number }> {
  await requireBcOwnership(missionId, bcId);
  const designations = await listBonCommandeDesignationsByBc(bcId);
  const intervenantIds = [
    ...new Set(
      designations.map((d) => d.intervenantId).filter((id): id is string => Boolean(id)),
    ),
  ];
  if (intervenantIds.length === 0) {
    throw new MissionMutationError(
      "Aucun intervenant affecté aux désignations du BC.",
      "validation",
    );
  }
  for (const [index, intervenantId] of intervenantIds.entries()) {
    const suffix =
      intervenantIds.length === 1 ? "" : `-${String(index + 1).padStart(2, "0")}`;
    const created = await createRmiRepo({
      id: crypto.randomUUID(),
      bcId,
      createdBy: userId,
      rmiNumber: `${baseNumber}${suffix}`,
      type: "RMI",
    });
    await createRmiRevision(created.id, "create", created, userId, "Création RMI par intervenant");
    for (const designation of designations.filter((d) => d.intervenantId === intervenantId)) {
      await createRmiAssignation({
        id: crypto.randomUUID(),
        rmiId: created.id,
        intervenantId,
        designationId: designation.id,
      });
    }
    await createOrUpdateDocRevision({
      missionId,
      bcId,
      entityType: "rmi",
      entityId: created.id,
      changeType: "create",
      revisionNumber: 1,
      label: `RMI créé (intervenant) : ${created.rmiNumber}`,
      changedBy: userId,
    });
  }
  await syncMissionAgendaMilestones(missionId, userId);
  return { created: intervenantIds.length };
}

export async function updateRmiDoc(
  missionId: string,
  bcId: string,
  rmiId: string,
  userId: string,
  data: Partial<Omit<MissionRmiInsert, "id" | "bcId" | "createdBy">>,
  reason?: string,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const updated = await updateRmi(rmiId, { ...data, updatedBy: userId });
  if (!updated) throw new MissionMutationError("RMI introuvable.", "not_found");
  const revs = await listRmiRevisions(rmiId);
  const changeType = revs.length >= 1 ? "avenant" : "update";
  await createRmiRevision(rmiId, changeType, updated, userId, reason);
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "rmi",
    entityId: rmiId,
    changeType,
    revisionNumber: revs.length + 1,
    label: `RMI ${changeType === "avenant" ? "amendé" : "mis à jour"} : ${updated.rmiNumber}`,
    changedBy: userId,
  });
  await syncMissionAgendaMilestones(missionId, userId);
}

export async function createBvDoc(
  missionId: string,
  bcId: string,
  userId: string,
  data: Omit<MissionBvInsert, "id" | "bcId" | "createdBy">,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const bv = await createBvRepo({
    id: crypto.randomUUID(),
    bcId,
    createdBy: userId,
    ...data,
  });
  await createBvRevision(bv.id, "create", bv, userId, "Création BV");
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "bv",
    entityId: bv.id,
    changeType: "create",
    revisionNumber: 1,
    label: `BV créé : ${bv.bvNumber}`,
    changedBy: userId,
  });
}

export async function createBvPerIntervenant(
  missionId: string,
  bcId: string,
  userId: string,
  baseNumber: string,
): Promise<{ created: number }> {
  await requireBcOwnership(missionId, bcId);
  const designations = await listBonCommandeDesignationsByBc(bcId);
  const intervenantIds = [
    ...new Set(
      designations.map((d) => d.intervenantId).filter((id): id is string => Boolean(id)),
    ),
  ];
  if (intervenantIds.length === 0) {
    throw new MissionMutationError(
      "Aucun intervenant affecté aux désignations du BC.",
      "validation",
    );
  }
  for (const [index, intervenantId] of intervenantIds.entries()) {
    const suffix =
      intervenantIds.length === 1 ? "" : `-${String(index + 1).padStart(2, "0")}`;
    const created = await createBvRepo({
      id: crypto.randomUUID(),
      bcId,
      createdBy: userId,
      bvNumber: `${baseNumber}${suffix}`,
      intervenantId,
      verse: false,
    });
    await createBvRevision(created.id, "create", created, userId, "Création BV par intervenant");
    await createOrUpdateDocRevision({
      missionId,
      bcId,
      entityType: "bv",
      entityId: created.id,
      changeType: "create",
      revisionNumber: 1,
      label: `BV créé (intervenant) : ${created.bvNumber}`,
      changedBy: userId,
    });
  }
  return { created: intervenantIds.length };
}

export async function updateBvDoc(
  missionId: string,
  bcId: string,
  bvId: string,
  userId: string,
  data: Partial<Omit<MissionBvInsert, "id" | "bcId" | "createdBy">>,
  reason?: string,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const updated = await updateBv(bvId, { ...data, updatedBy: userId });
  if (!updated) throw new MissionMutationError("BV introuvable.", "not_found");
  const revs = await listBvRevisions(bvId);
  const changeType = revs.length >= 1 ? "avenant" : "update";
  await createBvRevision(bvId, changeType, updated, userId, reason);
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "bv",
    entityId: bvId,
    changeType,
    revisionNumber: revs.length + 1,
    label: `BV ${changeType === "avenant" ? "amendé" : "mis à jour"} : ${updated.bvNumber}`,
    changedBy: userId,
  });
}

export async function createPvrfDoc(
  missionId: string,
  bcId: string,
  userId: string,
  data: Omit<MissionPvrfInsert, "id" | "bcId" | "createdBy">,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const pvrf = await createPvrfRepo({
    id: crypto.randomUUID(),
    bcId,
    createdBy: userId,
    ...data,
  });
  await createPvrfRevision(pvrf.id, "create", pvrf, userId, "Création PVRF");
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "pvrf",
    entityId: pvrf.id,
    changeType: "create",
    revisionNumber: 1,
    label: `PVRF créé : ${pvrf.pvrfNumber}`,
    changedBy: userId,
  });
}

export async function updatePvrfDoc(
  missionId: string,
  bcId: string,
  pvrfId: string,
  userId: string,
  data: Partial<Omit<MissionPvrfInsert, "id" | "bcId" | "createdBy">>,
  reason?: string,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const updated = await updatePvrf(pvrfId, { ...data, updatedBy: userId });
  if (!updated) throw new MissionMutationError("PVRF introuvable.", "not_found");
  const revs = await listPvrfRevisions(pvrfId);
  const changeType = revs.length >= 1 ? "avenant" : "update";
  await createPvrfRevision(pvrfId, changeType, updated, userId, reason);
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "pvrf",
    entityId: pvrfId,
    changeType,
    revisionNumber: revs.length + 1,
    label: `PVRF ${changeType === "avenant" ? "amendé" : "mis à jour"} : ${updated.pvrfNumber}`,
    changedBy: userId,
  });
}

export async function createQsDoc(
  missionId: string,
  bcId: string,
  userId: string,
  data: Omit<MissionQsInsert, "id" | "bcId" | "createdBy">,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const qs = await createQsRepo({
    id: crypto.randomUUID(),
    bcId,
    createdBy: userId,
    ...data,
  });
  await createQsRevision(qs.id, "create", qs, userId, "Création QS/PVRI");
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "qs",
    entityId: qs.id,
    changeType: "create",
    revisionNumber: 1,
    label: `QS/PVRI créé : ${qs.qsNumber}`,
    changedBy: userId,
  });
}

export async function updateQsDoc(
  missionId: string,
  bcId: string,
  qsId: string,
  userId: string,
  data: Partial<Omit<MissionQsInsert, "id" | "bcId" | "createdBy">>,
  reason?: string,
): Promise<void> {
  await requireBcOwnership(missionId, bcId);
  const updated = await updateQs(qsId, { ...data, updatedBy: userId });
  if (!updated) throw new MissionMutationError("QS introuvable.", "not_found");
  const revs = await listQsRevisions(qsId);
  const changeType = revs.length >= 1 ? "avenant" : "update";
  await createQsRevision(qsId, changeType, updated, userId, reason);
  await createOrUpdateDocRevision({
    missionId,
    bcId,
    entityType: "qs",
    entityId: qsId,
    changeType,
    revisionNumber: revs.length + 1,
    label: `QS/PVRI ${changeType === "avenant" ? "amendé" : "mis à jour"} : ${updated.qsNumber}`,
    changedBy: userId,
  });
}

export async function getBcEditorData(missionId: string, bcId: string) {
  await requireBcOwnership(missionId, bcId);
  const bc = await getBonCommandeById(bcId);
  if (!bc) throw new MissionMutationError("BC introuvable.", "not_found");
  const [designations, frais] = await Promise.all([
    listBonCommandeDesignationsByBc(bcId),
    listBonCommandeFraisByBc(bcId),
  ]);
  return {
    bcId: bc.id,
    bcNumber: bc.bcNumber,
    bcKind: bc.type,
    designations: designations.map((d) => ({
      id: d.id,
      titre: d.titre,
      description: d.description,
      nbJeh: d.nbJeh,
      montantJeh: d.montantJeh,
      prixTotalHt: d.prixTotalHt,
      intervenantId: d.intervenantId,
    })),
    frais: frais.map((f) => ({
      id: f.id,
      texte: f.texte,
      montantHt: f.montantHt,
    })),
  };
}

export async function listIntervenantOptions() {
  const rows = await db
    .select({ id: user.id, label: user.name })
    .from(user)
    .orderBy(user.name);
  return rows.map((r) => ({ id: r.id, label: r.label }));
}
