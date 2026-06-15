import type { DriveChildRow } from "./drive-open-url";

export type DriveTreeNodeKind = "drive" | "folder" | "file";

/** Rôle Drive pour code couleur des badges (API v3). */
export type DrivePermissionRole =
  | "reader"
  | "commenter"
  | "writer"
  | "fileOrganizer"
  | "organizer"
  | "owner"
  | "unknown";

export type DrivePermissionBadge = {
  text: string;
  role: DrivePermissionRole;
};

export type DriveTreeNodeData = {
  kind: DriveTreeNodeKind;
  driveId: string;
  name: string;
  mimeType: string;
  badges: DrivePermissionBadge[];
  fileId?: string;
  webViewLink?: string | null;
  expanded: boolean;
  loadingChildren: boolean;
  /** Mis à jour par la recherche : surbrillance du chemin cible. */
  searchHighlight?: boolean;
};

export function driveNodeId(driveId: string, fileId: string): string {
  return `n-${driveId}-${fileId}`;
}

/** Extrait l’id fichier Google depuis un id de nœud React Flow `driveNodeId` (suffixe après `n-{driveId}-`). */
export function driveGoogleFileIdFromRfNodeId(rfId: string, driveId: string): string | null {
  const prefix = `n-${driveId}-`;
  if (!rfId.startsWith(prefix)) return null;
  return rfId.slice(prefix.length);
}

export function driveRootNodeId(driveId: string): string {
  return `d-${driveId}`;
}

export type { DriveChildRow };
