import type { DriveChildRow } from "./drive-open-url";
import { frenchDriveRoleLabel, normalizeDrivePermissionRole } from "./drive-permission-role";
import type { DrivePermissionBadge } from "./drive-tree-types";

export type SharedDrive = { id: string; name: string };

export type DriveSearchHit = {
  id: string;
  name: string;
  mimeType: string;
  driveId: string;
  webViewLink: string | null;
  pathHint: string;
  folderIdsFromRoot: string[];
};

export type PermOut = {
  id: string;
  type: string;
  emailAddress: string | null;
  displayName: string | null;
  role: string | null;
  domain: string | null;
};

function principalPermissionLabel(p: PermOut): string {
  if (p.type === "group" && p.emailAddress) return p.emailAddress;
  if (p.type === "domain" && p.domain) return `Domaine ${p.domain}`;
  if (p.type === "user" && (p.emailAddress || p.displayName)) {
    return p.emailAddress ?? p.displayName ?? "utilisateur";
  }
  if (p.type === "anyone") return "Tout le monde";
  return p.type;
}

function permToBadge(p: PermOut): DrivePermissionBadge {
  const role = normalizeDrivePermissionRole(p.role);
  const head = principalPermissionLabel(p);
  if (role === "unknown") {
    const tail = p.role?.trim() ? ` (${p.role})` : "";
    return { text: `${head}${tail}`, role: "unknown" };
  }
  const fr = frenchDriveRoleLabel(role);
  return { text: `${head} (${fr})`, role };
}

function pickBadges(permissions: PermOut[]): DrivePermissionBadge[] {
  const ordered: PermOut[] = [
    ...permissions.filter((p) => p.type === "group"),
    ...permissions.filter((p) => p.type === "domain"),
    ...permissions.filter((p) => p.type === "user"),
    ...permissions.filter((p) => p.type === "anyone"),
  ];
  const badges = ordered.map(permToBadge);
  const max = 10;
  if (badges.length <= max) return badges;
  const more = badges.length - max;
  return [...badges.slice(0, max), { text: `+${more} autres`, role: "unknown" as const }];
}

export async function fetchJson<T>(
  url: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: unknown }> {
  const res = await fetch(url, { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true, data: body as T };
}

export async function fetchDriveSearch(query: string): Promise<DriveSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const sp = new URLSearchParams({ q });
  const r = await fetchJson<{ results: DriveSearchHit[] }>(
    `/api/app/drive/search?${sp.toString()}`,
  );
  if (!r.ok) return [];
  return r.data.results ?? [];
}

export async function fetchChildrenPage(
  driveId: string,
  parentId: string,
  pageToken: string | null,
): Promise<{ files: DriveChildRow[]; nextPageToken: string | null }> {
  const sp = new URLSearchParams({ driveId, parentId });
  if (pageToken) sp.set("pageToken", pageToken);
  const r = await fetchJson<{ files: DriveChildRow[]; nextPageToken: string | null }>(
    `/api/app/drive/children?${sp.toString()}`,
  );
  if (!r.ok) {
    const b = r.body as { message?: string };
    const msg =
      typeof b?.message === "string"
        ? b.message
        : r.status === 403
          ? "Accès Drive refusé ou compte Google non configuré."
          : "Impossible de charger le contenu du dossier.";
    throw new Error(msg);
  }
  return r.data;
}

/** Permissions sur un fichier/dossier ; pour la racine d’un drive partagé, `fileId === driveId`. */
export async function fetchPermissionBadges(
  driveId: string,
  fileId: string,
): Promise<DrivePermissionBadge[]> {
  const sp = new URLSearchParams({ driveId, fileId });
  const permRes = await fetchJson<{ permissions: PermOut[] }>(
    `/api/app/drive/permissions?${sp.toString()}`,
  );
  if (!permRes.ok) return [];
  return pickBadges(permRes.data.permissions);
}

export async function attachBadgesInChunks(
  driveId: string,
  files: DriveChildRow[],
  onUpdate: (id: string, badges: DrivePermissionBadge[]) => void,
): Promise<void> {
  const chunk = 6;
  for (let i = 0; i < files.length; i += chunk) {
    const slice = files.slice(i, i + chunk);
    const results = await Promise.all(
      slice.map(async (f) => ({ id: f.id, badges: await fetchPermissionBadges(driveId, f.id) })),
    );
    for (const { id, badges } of results) {
      onUpdate(id, badges);
    }
  }
}
