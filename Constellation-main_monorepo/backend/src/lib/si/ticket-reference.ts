import { and, eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { ticketReferenceSeq } from "../../db/schema";

export async function allocateTicketReference(createdAt: Date): Promise<string> {
  const year = createdAt.getFullYear();
  const month = createdAt.getMonth() + 1;

  return db.transaction(async (tx) => {
    await tx
      .insert(ticketReferenceSeq)
      .values({ year, month, lastValue: 0 })
      .onConflictDoNothing();

    const [updated] = await tx
      .update(ticketReferenceSeq)
      .set({ lastValue: sql`${ticketReferenceSeq.lastValue} + 1` })
      .where(and(eq(ticketReferenceSeq.year, year), eq(ticketReferenceSeq.month, month)))
      .returning({ lastValue: ticketReferenceSeq.lastValue });

    const next = updated?.lastValue ?? 1;
    const mm = String(month).padStart(2, "0");
    return `SI-${year}-${mm}-${String(next).padStart(4, "0")}`;
  });
}
