import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { db } from "../../db";
import { ticket } from "../../db/schema";
import { can } from "../ubac-http";
import type { AppVariables } from "../../types/app";

export async function getTicketOrNull(ticketId: string) {
  const [row] = await db.select().from(ticket).where(eq(ticket.id, ticketId)).limit(1);
  return row ?? null;
}

export function isTicketAgent(c: Context<{ Variables: AppVariables }>): boolean {
  return can(c, "si.ticket.manage");
}

export function canViewTicket(
  c: Context<{ Variables: AppVariables }>,
  row: { creatorUserId: string },
): boolean {
  const user = c.get("user");
  if (!user) return false;
  if (isTicketAgent(c)) return true;
  return row.creatorUserId === user.id;
}

export function canEditTicketMeta(
  c: Context<{ Variables: AppVariables }>,
  row: { creatorUserId: string; status: string },
): boolean {
  if (!canViewTicket(c, row)) return false;
  if (isTicketAgent(c)) return true;
  return row.creatorUserId === c.get("user")!.id && row.status === "open";
}
