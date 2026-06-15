export type GwGroupPermRow = {
  id: string;
  email: string;
  name: string | null;
  syncedAt: string;
  permissions: string[];
};

export type DraftByGroupId = Record<string, Set<string>>;

export type PermissionAcrossGroupsState =
  | { kind: "none" }
  | { kind: "all" }
  | { kind: "partial"; groupIds: string[] };

export function groupDisplayLabel(g: { email: string; name: string | null }) {
  return g.name ? `${g.email} — ${g.name}` : g.email;
}

export function matchesGroupSearch(
  g: { email: string; name: string | null },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${g.email} ${g.name ?? ""}`.toLowerCase();
  return haystack.includes(q);
}

export function draftFromRow(row: GwGroupPermRow): Set<string> {
  return new Set(row.permissions);
}

export function permissionAcrossGroups(
  draftByGroupId: DraftByGroupId,
  groupIds: string[],
  permissionId: string,
): PermissionAcrossGroupsState {
  if (groupIds.length === 0) return { kind: "none" };
  const withPerm: string[] = [];
  for (const gid of groupIds) {
    if (draftByGroupId[gid]?.has(permissionId)) withPerm.push(gid);
  }
  if (withPerm.length === 0) return { kind: "none" };
  if (withPerm.length === groupIds.length) return { kind: "all" };
  return { kind: "partial", groupIds: withPerm };
}

export function setPermissionForGroups(
  draft: DraftByGroupId,
  groupIds: string[],
  permissionId: string,
  checked: boolean,
): DraftByGroupId {
  const next: DraftByGroupId = { ...draft };
  for (const gid of groupIds) {
    const set = new Set(next[gid] ?? []);
    if (checked) set.add(permissionId);
    else set.delete(permissionId);
    next[gid] = set;
  }
  return next;
}

export function setPermissionsForGroups(
  draft: DraftByGroupId,
  groupIds: string[],
  permissionIds: string[],
  mode: "add" | "remove" | "replace",
): DraftByGroupId {
  const next: DraftByGroupId = { ...draft };
  for (const gid of groupIds) {
    const set = mode === "replace" ? new Set<string>() : new Set(next[gid] ?? []);
    for (const p of permissionIds) {
      if (mode === "remove") set.delete(p);
      else set.add(p);
    }
    next[gid] = set;
  }
  return next;
}

export function togglePermissionAcrossGroups(
  draft: DraftByGroupId,
  groupIds: string[],
  permissionId: string,
): DraftByGroupId {
  const state = permissionAcrossGroups(draft, groupIds, permissionId);
  const checked = state.kind !== "all";
  return setPermissionForGroups(draft, groupIds, permissionId, checked);
}
