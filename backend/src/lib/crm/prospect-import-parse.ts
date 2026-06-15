import ExcelJS from "exceljs";

import { mapApolloRowToProspectFields } from "./apollo-prospect-fields";
import type { ProspectStatus } from "../../db/schema";
import { PROSPECT_STATUSES, type prospect } from "../../db/schema";

export function isValidProspectStatus(s: unknown): s is ProspectStatus {
  return typeof s === "string" && (PROSPECT_STATUSES as readonly string[]).includes(s);
}

/** En-têtes Apollo / CRM : espaces → snake_case + alias courants. */
export function normalizeImportRowKeys(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [rawKey, value] of Object.entries(row)) {
    const v = value.trim();
    if (!v) continue;
    const lower = rawKey.trim().toLowerCase();
    out[lower] = v;
    const snake = lower.replace(/[^\w]+/g, "_").replace(/^_|_$/g, "");
    if (snake && !(snake in out)) out[snake] = v;
  }
  return out;
}

/** Parse CSV/TSV (Apollo : champs quotés, virgules dans les valeurs). */
export function parseCsvRows(text: string, sep: string): Record<string, string>[] {
  const cleaned = text.replace(/^\uFEFF/, "");
  const records = parseDelimitedRecords(cleaned, sep);
  if (records.length < 2) return [];

  const headers = records[0]!.map((h) =>
    h
      .replace(/^"|"$/g, "")
      .trim()
      .toLowerCase(),
  );
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < records.length; i++) {
    const cells = records[i]!;
    const obj: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((h, idx) => {
      if (!h) return;
      const value = (cells[idx] ?? "").trim();
      if (value) hasValue = true;
      obj[h] = value;
    });
    if (hasValue) rows.push(normalizeImportRowKeys(obj));
  }

  return rows;
}

/** Découpe un fichier CSV/TSV en lignes de cellules (RFC 4180 simplifié). */
function parseDelimitedRecords(text: string, sep: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
    cell = "";
  };

  const pushRow = () => {
    if (row.length > 0 || cell.length > 0) {
      pushCell();
      if (row.some((c) => c.length > 0)) records.push(row);
    }
    row = [];
    cell = "";
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      pushCell();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      pushRow();
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) pushRow();
  return records;
}

export async function parseXlsxRows(buffer: ArrayBuffer): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  const excelBuffer = Buffer.from(buffer) as unknown as Parameters<typeof workbook.xlsx.load>[0];
  await workbook.xlsx.load(excelBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headerValues = worksheet.getRow(1).values as Array<string | number | null>;
  const headers = headerValues.slice(1).map((h) =>
    String(h ?? "")
      .trim()
      .toLowerCase(),
  );

  if (headers.length === 0) return [];

  const rows: Record<string, string>[] = [];
  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    const obj: Record<string, string> = {};
    let hasValue = false;

    headers.forEach((header, colIndex) => {
      if (!header) return;
      const cell = row.getCell(colIndex + 1);
      const value = String(cell.text ?? cell.value ?? "").trim();
      if (value) hasValue = true;
      obj[header] = value;
    });

    if (hasValue) rows.push(normalizeImportRowKeys(obj));
  }

  return rows;
}

/** Normalise un objet de ligne CSV/xlsx vers les champs prospect. */
export function rowToProspect(
  row: Record<string, string>,
): Omit<typeof prospect.$inferInsert, "id" | "createdAt" | "updatedAt"> {
  const mapped = mapApolloRowToProspectFields(row);
  const rawStatut = normalizeImportRowKeys(row);
  const statutRaw = rawStatut.statut ?? rawStatut.status;
  const statut = isValidProspectStatus(statutRaw) ? statutRaw : "a_contacter";
  return { ...mapped, statut };
}
