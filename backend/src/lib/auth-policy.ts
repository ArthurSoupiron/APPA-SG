import { eq } from "drizzle-orm";

import { db } from "../db";
import { systemAuthPolicy } from "../db/schema";

export const AUTH_POLICY_ID = "default";

const CACHE_TTL_MS = 5_000;

let cachedEnabled: boolean | null = null;
let cacheExpiresAt = 0;

function readCache(): boolean | null {
  if (cachedEnabled === null || Date.now() > cacheExpiresAt) {
    return null;
  }
  return cachedEnabled;
}

function writeCache(enabled: boolean) {
  cachedEnabled = enabled;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

export async function getEmailPasswordEnabled(): Promise<boolean> {
  const cached = readCache();
  if (cached !== null) return cached;

  const rows = await db
    .select({ emailPasswordEnabled: systemAuthPolicy.emailPasswordEnabled })
    .from(systemAuthPolicy)
    .where(eq(systemAuthPolicy.id, AUTH_POLICY_ID))
    .limit(1);

  const enabled = rows[0]?.emailPasswordEnabled ?? true;
  writeCache(enabled);
  return enabled;
}

export type AuthPolicyRow = {
  emailPasswordEnabled: boolean;
  updatedAt: Date;
  updatedBy: string | null;
};

export async function getAuthPolicy(): Promise<AuthPolicyRow> {
  const rows = await db
    .select({
      emailPasswordEnabled: systemAuthPolicy.emailPasswordEnabled,
      updatedAt: systemAuthPolicy.updatedAt,
      updatedBy: systemAuthPolicy.updatedBy,
    })
    .from(systemAuthPolicy)
    .where(eq(systemAuthPolicy.id, AUTH_POLICY_ID))
    .limit(1);

  if (rows[0]) return rows[0];

  return {
    emailPasswordEnabled: true,
    updatedAt: new Date(),
    updatedBy: null,
  };
}

export async function setEmailPasswordEnabled(
  enabled: boolean,
  updatedBy: string,
): Promise<AuthPolicyRow> {
  const now = new Date();
  await db
    .insert(systemAuthPolicy)
    .values({
      id: AUTH_POLICY_ID,
      emailPasswordEnabled: enabled,
      updatedBy,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: systemAuthPolicy.id,
      set: {
        emailPasswordEnabled: enabled,
        updatedBy,
        updatedAt: now,
      },
    });

  writeCache(enabled);

  return {
    emailPasswordEnabled: enabled,
    updatedAt: now,
    updatedBy,
  };
}
