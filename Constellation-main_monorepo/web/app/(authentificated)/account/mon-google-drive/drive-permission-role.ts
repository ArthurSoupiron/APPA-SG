import type { DrivePermissionRole } from "./drive-tree-types";

/** Rôles renvoyés par l’API Drive (v3), insensible à la casse. */
export function normalizeDrivePermissionRole(apiRole: string | null): DrivePermissionRole {
  if (!apiRole) return "unknown";
  const r = apiRole.trim().toLowerCase();
  if (r === "owner") return "owner";
  if (r === "organizer") return "organizer";
  if (r === "fileorganizer" || r === "file_organizer") return "fileOrganizer";
  if (r === "writer") return "writer";
  if (r === "commenter") return "commenter";
  if (r === "reader") return "reader";
  return "unknown";
}

export function frenchDriveRoleLabel(role: DrivePermissionRole): string {
  switch (role) {
    case "reader":
      return "lecteur";
    case "commenter":
      return "commentateur";
    case "writer":
      return "contributeur";
    case "fileOrganizer":
      return "gestionnaire";
    case "organizer":
      return "administrateur";
    case "owner":
      return "propriétaire";
    default:
      return "";
  }
}

/** Classes pour badges de permissions (fond + bordure + texte). */
export function drivePermissionBadgeClass(role: DrivePermissionRole): string {
  switch (role) {
    case "reader":
      return "border-sky-500/40 bg-sky-500/12 text-sky-950 dark:text-sky-100";
    case "commenter":
      return "border-cyan-500/40 bg-cyan-500/12 text-cyan-950 dark:text-cyan-100";
    case "writer":
      return "border-amber-500/45 bg-amber-500/14 text-amber-950 dark:text-amber-50";
    case "fileOrganizer":
      return "border-orange-500/45 bg-orange-500/14 text-orange-950 dark:text-orange-50";
    case "organizer":
      return "border-violet-500/45 bg-violet-500/14 text-violet-950 dark:text-violet-50";
    case "owner":
      return "border-emerald-500/50 bg-emerald-500/16 text-emerald-950 dark:text-emerald-50";
    default:
      return "border-border bg-secondary text-secondary-foreground";
  }
}
