import { google } from "googleapis";

import { getDriveWriteAuthForUser } from "../google-drive-user-auth";

export type SheetPermissionEntry = {
  id: string;
  type: string;
  role: string;
  emailAddress: string | null;
  displayName: string | null;
};

export async function listSheetPermissions(
  userId: string,
  fileId: string,
): Promise<{ ok: true; permissions: SheetPermissionEntry[] } | { ok: false; message: string }> {
  const authRes = await getDriveWriteAuthForUser(userId);
  if (!authRes.ok) return { ok: false, message: authRes.message };

  const api = google.drive({ version: "v3", auth: authRes.auth });
  try {
    const res = await api.permissions.list({
      fileId,
      fields: "permissions(id, type, role, emailAddress, displayName)",
      supportsAllDrives: true,
    });
    const permissions: SheetPermissionEntry[] = (res.data.permissions ?? []).map((p) => ({
      id: p.id ?? "",
      type: p.type ?? "unknown",
      role: p.role ?? "unknown",
      emailAddress: p.emailAddress ?? null,
      displayName: p.displayName ?? null,
    }));
    return { ok: true, permissions };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export function extractDriveFileIdFromUrl(url: string): string | null {
  const trimmed = url.trim();
  const spreadsheet = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (spreadsheet?.[1]) return spreadsheet[1];
  const file = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (file?.[1]) return file[1];
  const idParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return idParam?.[1] ?? null;
}
