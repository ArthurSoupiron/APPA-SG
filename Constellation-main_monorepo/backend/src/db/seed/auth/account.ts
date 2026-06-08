import type { InferInsertModel } from "drizzle-orm";

import { account } from "../../schema/auth/account";
import type { SeedDb } from "../db-type";

export type AccountSeedRow = InferInsertModel<typeof account>;

/**
 * Comptes OAuth / credentials — `userId` doit exister dans `auth.user`.
 * Jetons OAuth volatiles : laissés à null en seed (ne pas versionner de secrets).
 */
export const ACCOUNT_SEED_ROWS: AccountSeedRow[] = [
  {
    id: "wGVdYfB7yI07x39gZKbcrxQPcbdU9bQH",
    accountId: "103832739544109302966",
    providerId: "google",
    userId: "c6Li673JuNettIUEeyHNNyyyANjposzt",
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: new Date("2026-05-01T22:08:10.77"),
    refreshTokenExpiresAt: null,
    scope:
      "https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/script.scriptapp,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/admin.directory.group.readonly,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/gmail.compose,https://www.googleapis.com/auth/userinfo.profile,openid,https://www.googleapis.com/auth/drive.readonly",
    password: null,
    createdAt: new Date("2026-05-01T21:08:11.778"),
    updatedAt: new Date("2026-05-01T21:08:11.778"),
  },
];

export async function seedAuthAccounts(db: SeedDb): Promise<void> {
  if (ACCOUNT_SEED_ROWS.length === 0) return;
  await db.insert(account).values(ACCOUNT_SEED_ROWS).onConflictDoNothing({ target: account.id });
}
