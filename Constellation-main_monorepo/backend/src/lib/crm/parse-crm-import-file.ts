import { parseCsvRows, parseXlsxRows } from "./prospect-import-parse";
import type { FormDataUploadBlob } from "../multipart-files";

export type ParseCrmImportFileResult =
  | { ok: true; rows: Record<string, string>[] }
  | { ok: false; error: string; status: number; message?: string };

export async function parseCrmImportFile(
  file: FormDataUploadBlob,
): Promise<ParseCrmImportFileResult> {
  const fileName = file.name.toLowerCase();

  try {
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const buf = await file.arrayBuffer();
      const rows = await parseXlsxRows(buf);
      return { ok: true, rows };
    }

    const buf = await file.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(buf);
    const sep = fileName.endsWith(".tsv") || text.includes("\t") ? "\t" : ",";
    const rows = parseCsvRows(text, sep);
    return { ok: true, rows };
  } catch (e) {
    console.error("[crm-import] parse file failed:", e);
    return {
      ok: false,
      error: "parse_failed",
      status: 422,
      message: "Impossible de lire le fichier (format ou contenu invalide).",
    };
  }
}
