import { desc, eq } from "drizzle-orm";

import { db } from "../../db";
import {
  missionBcRevision,
  missionBvRevision,
  missionDocumentEvent,
  missionFaRevision,
  missionFsRevision,
  missionPvrfRevision,
  missionQsRevision,
  missionRmiRevision,
} from "../../db/schema";
import type {
  MissionDocumentEvent,
  MissionDocumentEventInsert,
  RevisionChangeType,
} from "../../types/missions";

type RevisionTable =
  | typeof missionBcRevision
  | typeof missionRmiRevision
  | typeof missionFaRevision
  | typeof missionFsRevision
  | typeof missionBvRevision
  | typeof missionPvrfRevision
  | typeof missionQsRevision;

async function getNextRevisionNumber(
  table: RevisionTable,
  entityId: string,
): Promise<number> {
  const rows = await db
    .select({ rev: table.revisionNumber })
    .from(table)
    .where(eq(table.entityId, entityId))
    .orderBy(desc(table.revisionNumber))
    .limit(1);
  return rows.length > 0 ? (rows[0]?.rev ?? 0) + 1 : 1;
}

export async function createBcRevision(
  entityId: string,
  changeType: RevisionChangeType,
  payload: object,
  changedBy?: string | null,
  reason?: string | null,
) {
  const revisionNumber = await getNextRevisionNumber(missionBcRevision, entityId);
  const result = await db
    .insert(missionBcRevision)
    .values({
      id: crypto.randomUUID(),
      entityId,
      revisionNumber,
      changeType,
      payloadSnapshot: payload,
      changedBy: changedBy ?? null,
      reason: reason ?? null,
    })
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) throw new Error("Impossible de créer la révision BC.");
  return row;
}

export async function listBcRevisions(entityId: string) {
  return db
    .select()
    .from(missionBcRevision)
    .where(eq(missionBcRevision.entityId, entityId))
    .orderBy(desc(missionBcRevision.revisionNumber));
}

export async function createRmiRevision(
  entityId: string,
  changeType: RevisionChangeType,
  payload: object,
  changedBy?: string | null,
  reason?: string | null,
) {
  const revisionNumber = await getNextRevisionNumber(missionRmiRevision, entityId);
  const result = await db
    .insert(missionRmiRevision)
    .values({
      id: crypto.randomUUID(),
      entityId,
      revisionNumber,
      changeType,
      payloadSnapshot: payload,
      changedBy: changedBy ?? null,
      reason: reason ?? null,
    })
    .returning();
  return Array.isArray(result) ? result[0] : undefined;
}

export async function listRmiRevisions(entityId: string) {
  return db
    .select()
    .from(missionRmiRevision)
    .where(eq(missionRmiRevision.entityId, entityId))
    .orderBy(desc(missionRmiRevision.revisionNumber));
}

export async function createFaRevision(
  entityId: string,
  changeType: RevisionChangeType,
  payload: object,
  changedBy?: string | null,
  reason?: string | null,
) {
  const revisionNumber = await getNextRevisionNumber(missionFaRevision, entityId);
  const result = await db
    .insert(missionFaRevision)
    .values({
      id: crypto.randomUUID(),
      entityId,
      revisionNumber,
      changeType,
      payloadSnapshot: payload,
      changedBy: changedBy ?? null,
      reason: reason ?? null,
    })
    .returning();
  return Array.isArray(result) ? result[0] : undefined;
}

export async function listFaRevisions(entityId: string) {
  return db
    .select()
    .from(missionFaRevision)
    .where(eq(missionFaRevision.entityId, entityId))
    .orderBy(desc(missionFaRevision.revisionNumber));
}

export async function createFsRevision(
  entityId: string,
  changeType: RevisionChangeType,
  payload: object,
  changedBy?: string | null,
  reason?: string | null,
) {
  const revisionNumber = await getNextRevisionNumber(missionFsRevision, entityId);
  const result = await db
    .insert(missionFsRevision)
    .values({
      id: crypto.randomUUID(),
      entityId,
      revisionNumber,
      changeType,
      payloadSnapshot: payload,
      changedBy: changedBy ?? null,
      reason: reason ?? null,
    })
    .returning();
  return Array.isArray(result) ? result[0] : undefined;
}

export async function listFsRevisions(entityId: string) {
  return db
    .select()
    .from(missionFsRevision)
    .where(eq(missionFsRevision.entityId, entityId))
    .orderBy(desc(missionFsRevision.revisionNumber));
}

export async function createBvRevision(
  entityId: string,
  changeType: RevisionChangeType,
  payload: object,
  changedBy?: string | null,
  reason?: string | null,
) {
  const revisionNumber = await getNextRevisionNumber(missionBvRevision, entityId);
  const result = await db
    .insert(missionBvRevision)
    .values({
      id: crypto.randomUUID(),
      entityId,
      revisionNumber,
      changeType,
      payloadSnapshot: payload,
      changedBy: changedBy ?? null,
      reason: reason ?? null,
    })
    .returning();
  return Array.isArray(result) ? result[0] : undefined;
}

export async function listBvRevisions(entityId: string) {
  return db
    .select()
    .from(missionBvRevision)
    .where(eq(missionBvRevision.entityId, entityId))
    .orderBy(desc(missionBvRevision.revisionNumber));
}

export async function createPvrfRevision(
  entityId: string,
  changeType: RevisionChangeType,
  payload: object,
  changedBy?: string | null,
  reason?: string | null,
) {
  const revisionNumber = await getNextRevisionNumber(missionPvrfRevision, entityId);
  const result = await db
    .insert(missionPvrfRevision)
    .values({
      id: crypto.randomUUID(),
      entityId,
      revisionNumber,
      changeType,
      payloadSnapshot: payload,
      changedBy: changedBy ?? null,
      reason: reason ?? null,
    })
    .returning();
  return Array.isArray(result) ? result[0] : undefined;
}

export async function listPvrfRevisions(entityId: string) {
  return db
    .select()
    .from(missionPvrfRevision)
    .where(eq(missionPvrfRevision.entityId, entityId))
    .orderBy(desc(missionPvrfRevision.revisionNumber));
}

export async function createQsRevision(
  entityId: string,
  changeType: RevisionChangeType,
  payload: object,
  changedBy?: string | null,
  reason?: string | null,
) {
  const revisionNumber = await getNextRevisionNumber(missionQsRevision, entityId);
  const result = await db
    .insert(missionQsRevision)
    .values({
      id: crypto.randomUUID(),
      entityId,
      revisionNumber,
      changeType,
      payloadSnapshot: payload,
      changedBy: changedBy ?? null,
      reason: reason ?? null,
    })
    .returning();
  return Array.isArray(result) ? result[0] : undefined;
}

export async function listQsRevisions(entityId: string) {
  return db
    .select()
    .from(missionQsRevision)
    .where(eq(missionQsRevision.entityId, entityId))
    .orderBy(desc(missionQsRevision.revisionNumber));
}

export async function appendMissionDocumentEvent(
  values: Omit<MissionDocumentEventInsert, "id">,
): Promise<MissionDocumentEvent> {
  const result = await db
    .insert(missionDocumentEvent)
    .values({ id: crypto.randomUUID(), ...values })
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) throw new Error("Impossible de créer l'événement mission.");
  return row;
}

export async function listMissionDocumentEvents(
  missionId: string,
): Promise<MissionDocumentEvent[]> {
  return db
    .select()
    .from(missionDocumentEvent)
    .where(eq(missionDocumentEvent.missionId, missionId))
    .orderBy(desc(missionDocumentEvent.changedAt));
}
