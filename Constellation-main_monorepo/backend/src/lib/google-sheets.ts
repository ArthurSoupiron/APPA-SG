import { google } from "googleapis";

import { sheetAppendRange, sheetRowRange } from "./google-sheet-range";
import { getGoogleOAuthForUser } from "./google-account-auth";
import {
  historyTabForYear,
  historyYearFromIsoDate,
  LEGACY_HISTORY_TAB,
  LEGACY_TICKETS_TAB,
  listTicketBackupTabNames,
  ticketsTabForYear,
} from "./si/si-sheet-tabs";

export { ticketsTabForYear, historyTabForYear, LEGACY_TICKETS_TAB, LEGACY_HISTORY_TAB } from "./si/si-sheet-tabs";

/** @deprecated Utiliser ticketsTabForYear(year) */
export const SI_TICKET_SHEET_TABS = {
  tickets: LEGACY_TICKETS_TAB,
  history: LEGACY_HISTORY_TAB,
} as const;

export const TICKETS_SHEET_HEADERS = [
  "reference",
  "ticket_id",
  "title",
  "status",
  "category",
  "creator_user_id",
  "assignee_user_id",
  "created_at",
  "updated_at",
  "closed_at",
  "drive_folder_id",
  "drive_folder_url",
  "description",
  "audit_snapshot_json",
  "comments_json",
  "attachments_json",
  "status_log_json",
  "watchers_json",
  "last_exported_at",
] as const;

export const HISTORY_SHEET_HEADERS = [
  "reference",
  "event_at",
  "event_kind",
  "user_id",
  "detail_json",
] as const;

export function getSiTicketsSheetId(): string | null {
  const id = process.env.DRIVE_SI_TICKETS_SHEET_ID?.trim();
  return id || null;
}

async function getSheetsApi(userId: string) {
  const authRes = await getGoogleOAuthForUser(userId, {
    driveRead: false,
    driveWrite: false,
    spreadsheets: true,
  });
  if (!authRes.ok) return authRes;
  return { ok: true as const, sheets: google.sheets({ version: "v4", auth: authRes.auth }) };
}

async function getSpreadsheetTabTitles(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
): Promise<Set<string>> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  return new Set(
    (meta.data.sheets ?? [])
      .map((s) => s.properties?.title)
      .filter((t): t is string => Boolean(t)),
  );
}

async function ensureTabExists(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  titles: Set<string>,
  tab: string,
): Promise<void> {
  if (titles.has(tab)) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
  });
  titles.add(tab);
}

async function ensureTicketsTabHeaders(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tab: string,
): Promise<void> {
  const ticketsCol = TICKETS_SHEET_HEADERS.length;
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetRowRange(tab, 1, ticketsCol),
  });
  const existingHeaders = (headerRes.data.values?.[0] ?? []) as string[];
  if (existingHeaders.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [[...TICKETS_SHEET_HEADERS]] },
    });
    return;
  }
  const missing = TICKETS_SHEET_HEADERS.filter((h) => !existingHeaders.includes(h));
  if (missing.length > 0) {
    const merged = [...existingHeaders, ...missing];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: sheetRowRange(tab, 1, merged.length),
      valueInputOption: "RAW",
      requestBody: { values: [merged] },
    });
  }
}

async function ensureHistoryTabHeaders(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tab: string,
): Promise<void> {
  const histHeader = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A1:E1`,
  });
  if (!histHeader.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [[...HISTORY_SHEET_HEADERS]] },
    });
  }
}

export async function ensureTicketsYearTab(
  userId: string,
  year: number,
): Promise<{ ok: true; tab: string } | { ok: false; message: string }> {
  const sheetId = getSiTicketsSheetId();
  if (!sheetId) {
    return { ok: false, message: "DRIVE_SI_TICKETS_SHEET_ID non configuré." };
  }

  const apiRes = await getSheetsApi(userId);
  if (!apiRes.ok) return apiRes;

  const tab = ticketsTabForYear(year);
  try {
    const titles = await getSpreadsheetTabTitles(apiRes.sheets, sheetId);
    await ensureTabExists(apiRes.sheets, sheetId, titles, tab);
    await ensureTicketsTabHeaders(apiRes.sheets, sheetId, tab);
    return { ok: true, tab };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function ensureHistoryYearTab(
  userId: string,
  year: number,
): Promise<{ ok: true; tab: string } | { ok: false; message: string }> {
  const sheetId = getSiTicketsSheetId();
  if (!sheetId) {
    return { ok: false, message: "DRIVE_SI_TICKETS_SHEET_ID non configuré." };
  }

  const apiRes = await getSheetsApi(userId);
  if (!apiRes.ok) return apiRes;

  const tab = historyTabForYear(year);
  try {
    const titles = await getSpreadsheetTabTitles(apiRes.sheets, sheetId);
    await ensureTabExists(apiRes.sheets, sheetId, titles, tab);
    await ensureHistoryTabHeaders(apiRes.sheets, sheetId, tab);
    return { ok: true, tab };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** @deprecated Préférer ensureTicketsYearTab / ensureHistoryYearTab */
export async function ensureSiTicketSheetTabs(userId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const y = new Date().getFullYear();
  const t = await ensureTicketsYearTab(userId, y);
  if (!t.ok) return t;
  const h = await ensureHistoryYearTab(userId, y);
  if (!h.ok) return h;
  return { ok: true };
}

async function findTicketRowIndex(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tab: string,
  reference: string,
): Promise<number | null> {
  const col = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A:A`,
  });
  const rows = col.data.values ?? [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]?.[0] === reference) return i + 1;
  }
  return null;
}

export async function upsertTicketSheetRow(
  actorUserId: string,
  year: number,
  row: Record<(typeof TICKETS_SHEET_HEADERS)[number], string>,
): Promise<{ ok: true; tab: string } | { ok: false; message: string }> {
  const sheetId = getSiTicketsSheetId();
  if (!sheetId) return { ok: false, message: "DRIVE_SI_TICKETS_SHEET_ID non configuré." };

  const ensure = await ensureTicketsYearTab(actorUserId, year);
  if (!ensure.ok) return ensure;
  const tab = ensure.tab;

  const apiRes = await getSheetsApi(actorUserId);
  if (!apiRes.ok) return apiRes;

  const values = TICKETS_SHEET_HEADERS.map((h) => row[h] ?? "");
  try {
    const rowIndex = await findTicketRowIndex(apiRes.sheets, sheetId, tab, row.reference);
    const colCount = TICKETS_SHEET_HEADERS.length;
    if (rowIndex) {
      await apiRes.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: sheetRowRange(tab, rowIndex, colCount),
        valueInputOption: "RAW",
        requestBody: { values: [values] },
      });
    } else {
      await apiRes.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: sheetAppendRange(tab, colCount),
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [values] },
      });
    }
    return { ok: true, tab };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function appendHistorySheetRow(
  actorUserId: string,
  eventAtIso: string,
  row: Record<(typeof HISTORY_SHEET_HEADERS)[number], string>,
): Promise<{ ok: true; tab: string } | { ok: false; message: string }> {
  const sheetId = getSiTicketsSheetId();
  if (!sheetId) return { ok: false, message: "DRIVE_SI_TICKETS_SHEET_ID non configuré." };

  const year = historyYearFromIsoDate(eventAtIso);
  const ensure = await ensureHistoryYearTab(actorUserId, year);
  if (!ensure.ok) return ensure;
  const tab = ensure.tab;

  const apiRes = await getSheetsApi(actorUserId);
  if (!apiRes.ok) return apiRes;

  const values = HISTORY_SHEET_HEADERS.map((h) => row[h] ?? "");
  try {
    await apiRes.sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: sheetAppendRange(tab, HISTORY_SHEET_HEADERS.length),
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] },
    });
    return { ok: true, tab };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function readSheetTab(
  actorUserId: string,
  tab: string,
): Promise<{ ok: true; rows: string[][] } | { ok: false; message: string }> {
  const sheetId = getSiTicketsSheetId();
  if (!sheetId) return { ok: false, message: "DRIVE_SI_TICKETS_SHEET_ID non configuré." };

  const apiRes = await getSheetsApi(actorUserId);
  if (!apiRes.ok) return apiRes;

  try {
    const res = await apiRes.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tab}!A:Z`,
    });
    return { ok: true, rows: (res.data.values as string[][]) ?? [] };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** Lit tous les onglets tickets (`tickets-AAAA` + éventuel `tickets` legacy). */
export async function readAllTicketBackupTabs(
  actorUserId: string,
): Promise<
  | { ok: true; tabs: { tab: string; rows: string[][] }[] }
  | { ok: false; message: string }
> {
  const sheetId = getSiTicketsSheetId();
  if (!sheetId) return { ok: false, message: "DRIVE_SI_TICKETS_SHEET_ID non configuré." };

  const apiRes = await getSheetsApi(actorUserId);
  if (!apiRes.ok) return apiRes;

  try {
    const titles = await getSpreadsheetTabTitles(apiRes.sheets, sheetId);
    const tabNames = listTicketBackupTabNames(titles);
    const tabs: { tab: string; rows: string[][] }[] = [];
    for (const tab of tabNames) {
      const res = await apiRes.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${tab}!A:Z`,
      });
      tabs.push({ tab, rows: (res.data.values as string[][]) ?? [] });
    }
    return { ok: true, tabs };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
