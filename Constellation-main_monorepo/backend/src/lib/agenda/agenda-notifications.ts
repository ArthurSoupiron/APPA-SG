import { and, eq, inArray } from "drizzle-orm";

import { db } from "../../db";
import { agendaEventNotification, user } from "../../db/schema";
import { sendAgendaEmail } from "./agenda-email";
import { getAgendaEnv } from "./agenda-env";

export async function notifyAgendaUsers(
  userIds: string[],
  eventId: string,
  kind: string,
  payload: Record<string, unknown>,
  email?: { subject: string; bodyText: string },
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return;

  await db.insert(agendaEventNotification).values(
    unique.map((userId) => ({
      id: crypto.randomUUID(),
      userId,
      eventId,
      kind,
      payload,
    })),
  );

  if (!email) return;

  const users = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.id, unique));

  const baseUrl = getAgendaEnv().appBaseUrl;
  const link = baseUrl ? `${baseUrl}/account/agenda?event=${eventId}` : "";

  for (const u of users) {
    if (!u.email) continue;
    void sendAgendaEmail(
      u.email,
      email.subject,
      `${email.bodyText}${link ? `\n\n${link}` : ""}`.trim(),
    );
  }
}

export async function markAgendaNotificationsRead(userId: string, ids: string[]) {
  if (ids.length === 0) return;
  await db
    .update(agendaEventNotification)
    .set({ readAt: new Date() })
    .where(and(eq(agendaEventNotification.userId, userId), inArray(agendaEventNotification.id, ids)));
}
