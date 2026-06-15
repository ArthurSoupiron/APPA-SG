/** Plafond taille fichier import CRM (octets). */
export const CRM_IMPORT_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB

/** Nombre max de lignes données après parsing (CSV/TSV/XLSX). */
export const CRM_IMPORT_MAX_ROWS = 50_000;

export function importFileTooLargeMessage(maxBytes: number): string {
  return `file_too_large: max ${maxBytes} octets`;
}

export function importTooManyRowsMessage(maxRows: number): string {
  return `too_many_rows: max ${maxRows} lignes`;
}
