import { getGoogleOAuthForUser } from "../google-account-auth";

function parseAdminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function userCanExportSheets(userId: string): Promise<boolean> {
  const res = await getGoogleOAuthForUser(userId, {
    driveRead: false,
    driveWrite: false,
    spreadsheets: true,
  });
  return res.ok;
}

/**
 * Compte Google utilisé pour écrire le backup Sheets.
 * Essaie l’acteur de la mutation, puis SI_SHEET_EXPORT_USER_ID, puis les admins.
 */
export async function resolveSheetExportActorUserId(
  preferredUserId: string,
): Promise<{ userId: string } | { ok: false; message: string }> {
  if (await userCanExportSheets(preferredUserId)) {
    return { userId: preferredUserId };
  }

  const configured = process.env.SI_SHEET_EXPORT_USER_ID?.trim();
  if (configured && configured !== preferredUserId && (await userCanExportSheets(configured))) {
    return { userId: configured };
  }

  for (const adminId of parseAdminUserIds()) {
    if (adminId === preferredUserId || adminId === configured) continue;
    if (await userCanExportSheets(adminId)) {
      return { userId: adminId };
    }
  }

  return {
    ok: false,
    message:
      "Export Sheets impossible : aucun compte Google avec le scope spreadsheets (acteur, SI_SHEET_EXPORT_USER_ID ou admin). Reconnectez Google ou partagez le spreadsheet avec un compte autorisé.",
  };
}
