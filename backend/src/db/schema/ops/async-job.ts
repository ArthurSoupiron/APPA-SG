import { sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { opsSchema } from "../schemas";

export const asyncJob = opsSchema.table(
  "async_job",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    status: text("status").notNull(),
    progress: integer("progress"),
    label: text("label"),
    detail: jsonb("detail").$type<Record<string, unknown> | null>(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
    error: text("error"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    visibleToAll: boolean("visible_to_all").default(false).notNull(),
  },
  (t) => [
    check(
      "async_job_status_check",
      sql`${t.status} IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')`,
    ),
    check(
      "async_job_progress_check",
      sql`${t.progress} IS NULL OR (${t.progress} >= 0 AND ${t.progress} <= 100)`,
    ),
    index("async_job_status_idx").on(t.status),
    index("async_job_kind_idx").on(t.kind),
  ],
);
