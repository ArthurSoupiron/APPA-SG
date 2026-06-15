import { integer, primaryKey } from "drizzle-orm/pg-core";

import { siSchema } from "../schemas";

/** Séquence mensuelle pour références SI-AAAA-MM-NNNN */
export const ticketReferenceSeq = siSchema.table(
  "ticket_reference_seq",
  {
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    lastValue: integer("last_value").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.year, t.month] })],
);
