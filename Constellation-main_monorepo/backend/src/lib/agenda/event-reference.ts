import { and, eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { agendaEventReferenceSeq } from "../../db/schema";

export async function allocateAgendaEventReference(createdAt: Date): Promise<string> {
  const year = createdAt.getFullYear();
  const month = createdAt.getMonth() + 1;

  return db.transaction(async (tx) => {
    await tx
      .insert(agendaEventReferenceSeq)
      .values({ year, month, lastValue: 0 })
      .onConflictDoNothing();

    const [updated] = await tx
      .update(agendaEventReferenceSeq)
      .set({ lastValue: sql`${agendaEventReferenceSeq.lastValue} + 1` })
      .where(
        and(eq(agendaEventReferenceSeq.year, year), eq(agendaEventReferenceSeq.month, month)),
      )
      .returning({ lastValue: agendaEventReferenceSeq.lastValue });

    const next = updated?.lastValue ?? 1;
    const mm = String(month).padStart(2, "0");
    return `EVT-${year}-${mm}-${String(next).padStart(4, "0")}`;
  });
}
