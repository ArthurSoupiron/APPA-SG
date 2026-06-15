import { db } from "../../db";
import { agendaEventChangeLog } from "../../db/schema";

export async function recordAgendaChange(
  eventId: string,
  actorUserId: string | null,
  action: string,
  payload?: Record<string, unknown>,
) {
  await db.insert(agendaEventChangeLog).values({
    id: crypto.randomUUID(),
    eventId,
    actorUserId,
    action,
    payload: payload ?? null,
  });
}
