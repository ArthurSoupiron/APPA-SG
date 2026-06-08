/** Échappe une chaîne pour `name contains '…'` dans l’API Drive v3. */
export function escapeDriveNameContains(q: string): string {
  return q.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export type DriveSearchPathResult = {
  pathHint: string;
  /** Dossiers du drive racine jusqu’au parent direct de l’élément (dans cet ordre). */
  folderIdsFromRoot: string[];
  /** Segments de nom du drive racine vers la cible (pour affichage). */
  nameSegments: string[];
};

type DriveClient = {
  files: {
    get: (params: {
      fileId: string;
      supportsAllDrives?: boolean;
      fields?: string;
    }) => Promise<{ data: { name?: string | null; parents?: string[] | null } }>;
  };
};

export async function resolveDriveItemPath(
  drive: DriveClient,
  driveId: string,
  driveDisplayName: string,
  itemId: string,
): Promise<DriveSearchPathResult> {
  const folderIdsFromRoot: string[] = [];
  const nameSegments: string[] = [];
  let cur = itemId;

  for (let depth = 0; depth < 18; depth++) {
    const g = await drive.files.get({
      fileId: cur,
      supportsAllDrives: true,
      fields: "id,name,parents,driveId",
    });
    const name = g.data.name ?? "—";
    nameSegments.unshift(name);
    const parents = g.data.parents ?? [];
    if (parents.length === 0) break;
    const p = parents[0];
    if (!p || p === driveId) break;
    folderIdsFromRoot.unshift(p);
    cur = p;
  }

  const pathHint = `${driveDisplayName} › ${nameSegments.join(" › ")}`;
  return { pathHint, folderIdsFromRoot, nameSegments };
}
