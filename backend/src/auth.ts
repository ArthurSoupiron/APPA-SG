import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import {
  GOOGLE_CALENDAR_EVENTS_SCOPE,
  GOOGLE_DRIVE_SCOPE,
  GOOGLE_GMAIL_SEND_SCOPE,
  GOOGLE_SPREADSHEETS_SCOPE,
} from "./lib/google-oauth-scopes";

const corsOrigin = process.env.CORS_ORIGIN;
const baseURL = process.env.BETTER_AUTH_URL;

if (!corsOrigin) {
  throw new Error("CORS_ORIGIN is not set");
}
if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is not set");
}

/** Secure + SameSite explicites en déploiement (override : AUTH_COOKIE_SECURE=false derrière proxy HTTP interne). */
const authCookieSecureExplicit =
  process.env.AUTH_COOKIE_SECURE === "true" || process.env.AUTH_COOKIE_SECURE === "1";
const authCookieInsecureExplicit =
  process.env.AUTH_COOKIE_SECURE === "false" || process.env.AUTH_COOKIE_SECURE === "0";
const cookieSecure =
  authCookieSecureExplicit ||
  (!authCookieInsecureExplicit &&
    (baseURL.startsWith("https://") || process.env.NODE_ENV === "production"));

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

/** Scopes annuaire (sync groupes) — le compte Google doit être admin Workspace pour que l’API réponde. */
const GOOGLE_WORKSPACE_DIRECTORY_SCOPES = [
  "https://www.googleapis.com/auth/admin.directory.group.readonly",
  "https://www.googleapis.com/auth/admin.directory.group.member.readonly",
] as const;

/** Drive (écriture dossiers tickets SI) + Sheets backup — déclarer sur l’écran de consentement OAuth. */
const googleOAuth =
  googleClientId && googleClientSecret
    ? {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        prompt: "select_account consent" as const,
        accessType: "offline" as const,
        scope: [
          "openid",
          "email",
          "profile",
          GOOGLE_DRIVE_SCOPE,
          GOOGLE_SPREADSHEETS_SCOPE,
          GOOGLE_CALENDAR_EVENTS_SCOPE,
          GOOGLE_GMAIL_SEND_SCOPE,
          ...GOOGLE_WORKSPACE_DIRECTORY_SCOPES,
        ],
      }
    : null;

export const auth = betterAuth({
  baseURL,
  trustedOrigins: [corsOrigin],
  advanced: {
    useSecureCookies: cookieSecure,
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: cookieSecure,
      httpOnly: true,
    },
  },
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
  },
  ...(googleOAuth ? { socialProviders: { google: googleOAuth } } : {}),
  /**
   * https://better-auth.com/docs/concepts/rate-limit
   * En prod : actif par défaut (fenêtre / max). Ici on fixe explicitement + règles sensibles.
   * En dev : désactivé par défaut ; pour tester : rateLimit: { ...same, enabled: true }
   */
  rateLimit: {
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 10, max: 3 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
});
