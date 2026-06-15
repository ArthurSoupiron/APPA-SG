import { desc, eq, gte } from "drizzle-orm";

import { db } from "../db";
import { appAuditLog } from "../db/schema";

const SNAPSHOT_WINDOW_MS = 30 * 60 * 1000;
const SNAPSHOT_MAX_EVENTS = 100;

export async function recordAppAudit(input: {
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  payload?: Record<string, unknown> | null;
  requestPath?: string | null;
}): Promise<void> {
  await db.insert(appAuditLog).values({
    id: Bun.randomUUIDv7(),
    userId: input.userId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    payload: input.payload ?? null,
    requestPath: input.requestPath ?? null,
  });
}

export async function buildAuditSnapshotForUser(userId: string): Promise<Record<string, unknown>[]> {
  const since = new Date(Date.now() - SNAPSHOT_WINDOW_MS);
  const rows = await db
    .select({
      action: appAuditLog.action,
      resourceType: appAuditLog.resourceType,
      resourceId: appAuditLog.resourceId,
      payload: appAuditLog.payload,
      requestPath: appAuditLog.requestPath,
      createdAt: appAuditLog.createdAt,
    })
    .from(appAuditLog)
    .where(eq(appAuditLog.userId, userId))
    .orderBy(desc(appAuditLog.createdAt))
    .limit(SNAPSHOT_MAX_EVENTS);

  const filtered = rows.filter((r) => r.createdAt >= since);
  return filtered.map((r) => ({
    action: r.action,
    resourceType: r.resourceType,
    resourceId: r.resourceId,
    payload: r.payload,
    requestPath: r.requestPath,
    createdAt: r.createdAt.toISOString(),
  }));
}
