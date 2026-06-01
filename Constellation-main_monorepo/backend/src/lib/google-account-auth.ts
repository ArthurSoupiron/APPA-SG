import { and, eq } from "drizzle-orm";
import type { google } from "googleapis";

import { db } from "../db";
import { account } from "../db/schema";
import {
  googleIntegrationGaps,
  type GoogleIntegrationNeeds,
  scopeIncludesDriveRead,
} from "./google-oauth-scopes";

function accessTokenStillValid(expiresAt: Date | null | undefined, bufferMs = 90_000): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() > Date.now() + bufferMs;
}

export async function getGoogleAccountRow(userId: string) {
  const [googleAccount] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
    .limit(1);
  return googleAccount ?? null;
}

export async function getGoogleOAuthForUser(
  userId: string,
  needs: GoogleIntegrationNeeds,
): Promise<
  | { ok: true; auth: InstanceType<typeof google.auth.OAuth2>; scope: string | null }
  | { ok: false; message: string; gaps?: string[] }
> {
  const { google: googleApis } = await import("googleapis");
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return {
      ok: false,
      message: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquants côté backend.",
    };
  }

  const googleAccount = await getGoogleAccountRow(userId);
  if (!googleAccount) {
    return {
      ok: false,
      message:
        "Aucun compte Google lié. Connectez-vous avec Google pour utiliser Drive et les tickets SI.",
      gaps: ["google_account"],
    };
  }

  const gaps = googleIntegrationGaps(googleAccount.scope, needs);
  if (gaps.length > 0) {
    return {
      ok: false,
      message:
        "Le compte Google n’a pas tous les accès requis (Drive / Sheets). Déconnectez-vous puis reconnectez-vous avec Google.",
      gaps,
    };
  }

  const oauth2 = new googleApis.auth.OAuth2(clientId, clientSecret);

  if (googleAccount.refreshToken) {
    oauth2.setCredentials({
      refresh_token: googleAccount.refreshToken,
      access_token: googleAccount.accessToken ?? undefined,
      expiry_date: googleAccount.accessTokenExpiresAt
        ? googleAccount.accessTokenExpiresAt.getTime()
        : undefined,
    });
    await oauth2.getAccessToken();
    return { ok: true, auth: oauth2, scope: googleAccount.scope };
  }

  if (googleAccount.accessToken && accessTokenStillValid(googleAccount.accessTokenExpiresAt)) {
    oauth2.setCredentials({
      access_token: googleAccount.accessToken,
      expiry_date: googleAccount.accessTokenExpiresAt
        ? googleAccount.accessTokenExpiresAt.getTime()
        : undefined,
    });
    return { ok: true, auth: oauth2, scope: googleAccount.scope };
  }

  return {
    ok: false,
    message:
      "Pas de jeton Google utilisable (refresh_token absent ou session expirée). Reconnectez-vous avec Google.",
    gaps: ["token"],
  };
}

/** Statut d’intégration Google pour l’UI (bannière reconnexion). */
export async function getGoogleIntegrationStatus(userId: string) {
  const row = await getGoogleAccountRow(userId);
  if (!row) {
    return {
      linked: false,
      driveRead: false,
      driveWrite: false,
      spreadsheets: false,
      gaps: ["google_account"] as string[],
    };
  }
  const needs: GoogleIntegrationNeeds = {
    driveRead: true,
    driveWrite: true,
    spreadsheets: true,
  };
  const gaps = googleIntegrationGaps(row.scope, needs);
  return {
    linked: true,
    driveRead: scopeIncludesDriveRead(row.scope),
    driveWrite: gaps.includes("drive_write") === false,
    spreadsheets: gaps.includes("spreadsheets") === false,
    gaps,
  };
}
