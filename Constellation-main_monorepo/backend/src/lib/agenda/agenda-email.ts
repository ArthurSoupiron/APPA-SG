import { google } from "googleapis";

import { getSuperAdminUserIds } from "../../ubac";
import { getGoogleOAuthForUser } from "../google-account-auth";
import { scopeIncludesGmailSend } from "../google-oauth-scopes";

function encodeRawEmail(to: string, subject: string, bodyText: string): string {
  const lines = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    bodyText,
  ];
  return Buffer.from(lines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function resolveSenderUserId(): Promise<string | null> {
  const admins = getSuperAdminUserIds();
  return admins[0] ?? null;
}

/** Envoi email via Gmail API (compte Google du premier super-admin avec scope gmail.send). */
export async function sendAgendaEmail(to: string, subject: string, bodyText: string): Promise<void> {
  const senderId = await resolveSenderUserId();
  if (!senderId) {
    console.warn("[agenda-email] Aucun super-admin pour l’envoi Gmail.");
    return;
  }

  const authRes = await getGoogleOAuthForUser(senderId, {
    driveRead: false,
    driveWrite: false,
    spreadsheets: false,
  });
  if (!authRes.ok) {
    console.warn("[agenda-email] OAuth indisponible:", authRes.message);
    return;
  }
  if (!scopeIncludesGmailSend(authRes.scope)) {
    console.warn("[agenda-email] Scope gmail.send absent — reconnecter Google.");
    return;
  }

  try {
    const gmail = google.gmail({ version: "v1", auth: authRes.auth });
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodeRawEmail(to, subject, bodyText) },
    });
  } catch (err) {
    console.error("[agenda-email] Échec envoi:", err);
  }
}
