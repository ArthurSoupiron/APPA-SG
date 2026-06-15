/** Calendrier « journée » CRM : conversions `yyyy-MM-dd` ↔ ISO en heure locale du navigateur. */

export function isoToLocalYmd(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmdParts(ymd: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return [y, mo, d];
}

export function localYmdToUtcIsoStart(ymd: string): string | null {
  const p = parseYmdParts(ymd);
  if (!p) return null;
  const [y, mo, d] = p;
  return new Date(y, mo - 1, d, 0, 0, 0, 0).toISOString();
}

export function localYmdToUtcIsoEnd(ymd: string): string | null {
  const p = parseYmdParts(ymd);
  if (!p) return null;
  const [y, mo, d] = p;
  return new Date(y, mo - 1, d, 23, 59, 59, 999).toISOString();
}
