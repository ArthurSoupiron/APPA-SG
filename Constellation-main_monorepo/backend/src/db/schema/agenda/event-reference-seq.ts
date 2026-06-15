import { integer, primaryKey } from "drizzle-orm/pg-core";

import { agendaSchema } from "../schemas";

/** Séquence mensuelle pour références EVT-AAAA-MM-NNNN */
export const agendaEventReferenceSeq = agendaSchema.table(
  "event_reference_seq",
  {
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    lastValue: integer("last_value").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.year, t.month] })],
);
