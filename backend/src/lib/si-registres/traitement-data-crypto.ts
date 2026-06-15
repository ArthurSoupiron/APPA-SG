import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function getEncKey(): Buffer | null {
  const hex = process.env.TRAITEMENT_DATA_ENC_KEY?.trim();
  if (!hex) return null;
  if (hex.length !== 64) {
    throw new Error("TRAITEMENT_DATA_ENC_KEY doit faire 64 caractères hex (32 bytes).");
  }
  return Buffer.from(hex, "hex");
}

export function encryptTraitementDataField(value: string): string | null {
  if (!value) return null;
  const key = getEncKey();
  if (!key) return value;

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptTraitementDataField(value: string): string | null {
  if (!value) return null;
  const key = getEncKey();
  if (!key) return value;

  try {
    const buf = Buffer.from(value, "base64");
    if (buf.length < IV_LEN + TAG_LEN + 1) return value;
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    return value;
  }
}

const ENCRYPTED_FIELDS = ["nomTraitement", "reference", "descriptionFinalite"] as const;

export function decryptTraitementDataRow<T extends Record<string, unknown>>(row: T): T {
  const out = { ...row };
  for (const field of ENCRYPTED_FIELDS) {
    if (field in out && typeof out[field] === "string") {
      (out as Record<string, unknown>)[field] = decryptTraitementDataField(out[field] as string);
    }
  }
  return out;
}
