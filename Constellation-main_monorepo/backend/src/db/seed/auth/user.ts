import type { InferInsertModel } from "drizzle-orm";

import { user } from "../../schema/auth/user";
import type { SeedDb } from "../db-type";

export type UserSeedRow = InferInsertModel<typeof user>;

/**
 * Utilisateurs `auth.user` — à compléter (IDs stables si tu références ailleurs).
 * Champs avec défaut / $onUpdate en schéma : optionnels au typage Drizzle.
 */
export const USER_SEED_ROWS: UserSeedRow[] = [
  {
    id: "c6Li673JuNettIUEeyHNNyyyANjposzt",
    name: "Clément Viellard",
    email: "clement.viellard@jeece.fr",
    emailVerified: true,
    image:
      "https://lh3.googleusercontent.com/a/ACg8ocJ9zeQRnNqbcNOjR61s2utaYiVL9ga1F5Z-UXiDDHknmcQq5CI=s96-c",
    createdAt: new Date("2026-05-01T21:08:11.775"),
    updatedAt: new Date("2026-05-01T21:08:11.775"),
    role: "user",
  },
];

export async function seedAuthUsers(db: SeedDb): Promise<void> {
  if (USER_SEED_ROWS.length === 0) return;
  await db.insert(user).values(USER_SEED_ROWS).onConflictDoNothing({ target: user.id });
}
