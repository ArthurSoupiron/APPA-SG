import type { google } from "googleapis";

import { getGoogleOAuthForUser } from "./google-account-auth";

/**
 * OAuth Google de l’utilisateur connecté (jetons dans `auth.account`) pour l’API Drive.
 */
export async function getDriveAuthForUser(
  userId: string,
): Promise<
  { ok: true; auth: InstanceType<typeof google.auth.OAuth2> } | { ok: false; message: string }
> {
  const result = await getGoogleOAuthForUser(userId, {
    driveRead: true,
    driveWrite: false,
    spreadsheets: false,
  });
  if (!result.ok) return result;
  return { ok: true, auth: result.auth };
}

/** Drive avec droits d’écriture (tickets SI). */
export async function getDriveWriteAuthForUser(
  userId: string,
): Promise<
  { ok: true; auth: InstanceType<typeof google.auth.OAuth2> } | { ok: false; message: string }
> {
  const result = await getGoogleOAuthForUser(userId, {
    driveRead: true,
    driveWrite: true,
    spreadsheets: false,
  });
  if (!result.ok) return result;
  return { ok: true, auth: result.auth };
}
