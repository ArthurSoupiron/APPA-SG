// Module SG — accès au backend (BDD Postgres + Google Drive) via /api/app/assoc.
import type { ConformiteCheck, Deadline, GedDoc, Member } from "./sg-types";

type SgStateResponse = {
  members: Member[];
  docs: GedDoc[];
  deadlines: Deadline[];
  conformite: ConformiteCheck[];
};

/** Charge l'état du module depuis la base. */
export async function fetchSgState(): Promise<SgStateResponse | null> {
  try {
    const res = await fetch("/api/app/assoc/state", { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as SgStateResponse;
  } catch {
    return null;
  }
}

/** Persiste l'état complet (membres, documents, échéances, conformité). */
export async function saveSgState(data: {
  members: Member[];
  docs: GedDoc[];
  deadlines: Deadline[];
  conformite: ConformiteCheck[];
}): Promise<boolean> {
  try {
    const res = await fetch("/api/app/assoc/state", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        members: data.members,
        docs: data.docs,
        deadlines: data.deadlines,
        conformite: data.conformite,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type SgDriveUpload = {
  driveFileId: string;
  name: string;
  mimeType: string;
  webViewLink: string | null;
  size: string;
};

/** Téléverse un fichier dans le dossier Drive SG. */
export async function uploadSgDocument(file: File): Promise<SgDriveUpload | null> {
  try {
    const fd = new FormData();
    fd.append("files", file);
    const res = await fetch("/api/app/assoc/documents/upload", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) return null;
    return (await res.json()) as SgDriveUpload;
  } catch {
    return null;
  }
}

export type SgDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string | null;
  size: string | null;
};

/** Liste les fichiers du dossier Drive SG (pour l'import). */
export async function listSgDriveFiles(): Promise<SgDriveFile[]> {
  try {
    const res = await fetch("/api/app/assoc/drive/files", { credentials: "include" });
    if (!res.ok) return [];
    const json = (await res.json()) as { files?: SgDriveFile[] };
    return json.files ?? [];
  } catch {
    return [];
  }
}
