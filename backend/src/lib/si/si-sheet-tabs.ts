/** Onglet backup tickets pour une année (ex. `tickets-2026`). */
export const LEGACY_TICKETS_TAB = "tickets";
export const LEGACY_HISTORY_TAB = "history";

const TICKETS_YEAR_TAB_RE = /^tickets-(\d{4})$/;
const HISTORY_YEAR_TAB_RE = /^history-(\d{4})$/;

export function ticketsTabForYear(year: number): string {
  return `tickets-${year}`;
}

export function historyTabForYear(year: number): string {
  return `history-${year}`;
}

/** Année depuis la référence `SI-AAAA-MM-NNNN`. */
export function ticketYearFromReference(reference: string): number | null {
  const m = /^SI-(\d{4})-\d{2}-\d+$/i.exec(reference.trim());
  if (!m) return null;
  const y = Number(m[1]);
  return Number.isFinite(y) ? y : null;
}

export function ticketYearFromDate(date: Date): number {
  return date.getUTCFullYear();
}

export function resolveTicketExportYear(reference: string, createdAt: Date): number {
  return ticketYearFromReference(reference) ?? ticketYearFromDate(createdAt);
}

export function historyYearFromIsoDate(iso: string): number {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? ticketYearFromDate(d) : ticketYearFromDate(new Date());
}

export function parseTicketsYearTab(tab: string): number | null {
  const m = TICKETS_YEAR_TAB_RE.exec(tab);
  if (!m) return null;
  const y = Number(m[1]);
  return Number.isFinite(y) ? y : null;
}

export function isTicketBackupTab(tab: string): boolean {
  return tab === LEGACY_TICKETS_TAB || TICKETS_YEAR_TAB_RE.test(tab);
}

export function isHistoryBackupTab(tab: string): boolean {
  return tab === LEGACY_HISTORY_TAB || HISTORY_YEAR_TAB_RE.test(tab);
}

export function listTicketBackupTabNames(sheetTitles: Iterable<string>): string[] {
  const out: string[] = [];
  for (const title of sheetTitles) {
    if (isTicketBackupTab(title)) out.push(title);
  }
  return out.sort((a, b) => a.localeCompare(b));
}
