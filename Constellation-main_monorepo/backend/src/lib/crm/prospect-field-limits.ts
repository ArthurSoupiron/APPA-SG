/** Plafonds UTF-8 (bytes) pour limiter abus sur notes / metadata JSON. */

export const CRM_PROSPECT_NOTE_MAX_UTF8_BYTES = 65_536; // 64 KiB
export const CRM_CONTACT_EVENT_METADATA_MAX_UTF8_BYTES = 32_768; // 32 KiB

const encoder = new TextEncoder();

export function utf8ByteLength(s: string): number {
  return encoder.encode(s).length;
}

export function prospectNoteBodyExceedsLimit(body: string): boolean {
  return utf8ByteLength(body) > CRM_PROSPECT_NOTE_MAX_UTF8_BYTES;
}

export function contactEventMetadataExceedsLimit(
  metadata: Record<string, unknown> | null,
): boolean {
  if (metadata === null) return false;
  return utf8ByteLength(JSON.stringify(metadata)) > CRM_CONTACT_EVENT_METADATA_MAX_UTF8_BYTES;
}
