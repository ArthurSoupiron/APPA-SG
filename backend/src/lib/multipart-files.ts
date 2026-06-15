/** Entrée fichier extraite d’un `FormData` (compatible Bun / navigateur). */
export type ParsedUploadFile = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

/** Fichier unique d’un champ FormData (Blob, pas `instanceof File` — proxy Next / Bun). */
export type FormDataUploadBlob = {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export function getUploadBlobFromFormData(
  formData: FormData,
  fieldName = "file",
): FormDataUploadBlob | null {
  const entry = formData.get(fieldName);
  if (entry === null || typeof entry === "string") return null;
  if (typeof entry !== "object" || !("arrayBuffer" in entry)) return null;
  const blob = entry as Blob & { name?: string };
  const name =
    typeof blob.name === "string" && blob.name.trim() ? blob.name.trim() : "fichier";
  return {
    name,
    size: blob.size,
    arrayBuffer: () => blob.arrayBuffer(),
  };
}

function isBlobLike(entry: unknown): entry is Blob & { name?: string } {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "arrayBuffer" in entry &&
    typeof (entry as Blob).arrayBuffer === "function"
  );
}

/**
 * Lit les champs `files` (ou autre) d’un FormData.
 * N’utilise pas `instanceof File` : sous Bun / proxy, les entrées sont souvent des Blob.
 */
export async function parseUploadFilesFromFormData(
  formData: FormData,
  fieldName = "files",
): Promise<ParsedUploadFile[]> {
  const out: ParsedUploadFile[] = [];
  for (const entry of formData.getAll(fieldName)) {
    if (typeof entry === "string") continue;
    if (!isBlobLike(entry)) continue;
    const buffer = Buffer.from(await entry.arrayBuffer());
    if (buffer.length === 0) continue;
    const name =
      typeof entry.name === "string" && entry.name.trim() ? entry.name.trim() : "fichier";
    out.push({
      name,
      mimeType: entry.type?.trim() || guessMimeFromName(name),
      buffer,
    });
  }
  return out;
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return "application/octet-stream";
}
