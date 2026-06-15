import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "../../db";
import { ticketNotification, ticketWatcher } from "../../db/schema";

export async function notifyTicketWatchers(input: {
  ticketId: string;
  kind: string;
  payload: Record<string, unknown>;
  excludeUserId?: string | null;
}): Promise<void> {
  const watchers = await db
    .select({ userId: ticketWatcher.userId })
    .from(ticketWatcher)
    .where(eq(ticketWatcher.ticketId, input.ticketId));

  const userIds = new Set<string>();
  for (const w of watchers) {
    if (input.excludeUserId && w.userId === input.excludeUserId) continue;
    userIds.add(w.userId);
  }

  if (userIds.size === 0) return;

  await db.insert(ticketNotification).values(
    [...userIds].map((userId) => ({
      id: Bun.randomUUIDv7(),
      userId,
      ticketId: input.ticketId,
      kind: input.kind,
      payload: input.payload,
    })),
  );
}

export async function ensureCreatorWatcher(ticketId: string, creatorUserId: string): Promise<void> {
  await db
    .insert(ticketWatcher)
    .values({ ticketId, userId: creatorUserId })
    .onConflictDoNothing();
}

export async function markNotificationsRead(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const now = new Date();
  await db
    .update(ticketNotification)
    .set({ readAt: now })
    .where(
      and(
        eq(ticketNotification.userId, userId),
        inArray(ticketNotification.id, ids),
        isNull(ticketNotification.readAt),
      ),
    );
}
