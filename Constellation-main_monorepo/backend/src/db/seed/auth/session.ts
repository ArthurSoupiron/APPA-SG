import type { InferInsertModel } from "drizzle-orm";

import { session } from "../../schema/auth/session";
import type { SeedDb } from "../db-type";

export type SessionSeedRow = InferInsertModel<typeof session>;

/** Sessions — `userId` doit exister dans `auth.user`. */
export const SESSION_SEED_ROWS: SessionSeedRow[] = [
  // {
  //   id: "…",
  //   expiresAt: new Date(),
  //   token: "…",
  //   updatedAt: new Date(),
  //   userId: "…",
  // },
];

export async function seedAuthSessions(db: SeedDb): Promise<void> {
  if (SESSION_SEED_ROWS.length === 0) return;
  await db.insert(session).values(SESSION_SEED_ROWS).onConflictDoNothing({ target: session.id });
}
