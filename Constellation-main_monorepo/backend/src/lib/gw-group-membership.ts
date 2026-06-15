import { and, eq, sql } from "drizzle-orm";

import { db } from "../db";
import { workspaceGroupMember } from "../db/schema";

/** E-mail normalisé (trim + lower) → IDs de groupes après expansion des sous-groupes. */
export type WorkspaceGroupIdsByEmailLower = Map<string, string[]>;

/**
 * IDs des groupes Workspace dont l’utilisateur est membre (direct ou via sous-groupes).
 * Règle d’expansion : si l’utilisateur est dans G, il est aussi dans tout conteneur qui inclut G comme sous-groupe.
 */
export async function getWorkspaceGroupIdsForUserEmail(userEmail: string): Promise<string[]> {
  const email = userEmail.trim().toLowerCase();
  if (!email) return [];

  const directRows = await db
    .select({ containerGroupId: workspaceGroupMember.containerGroupId })
    .from(workspaceGroupMember)
    .where(
      and(
        eq(workspaceGroupMember.memberKind, "user"),
        sql`lower(${workspaceGroupMember.memberUserEmail}) = ${email}`,
      ),
    );

  const groupIds = new Set(directRows.map((r) => r.containerGroupId));

  const nestedEdges = await db
    .select({
      containerGroupId: workspaceGroupMember.containerGroupId,
      nestedId: workspaceGroupMember.memberNestedGroupId,
    })
    .from(workspaceGroupMember)
    .where(eq(workspaceGroupMember.memberKind, "group"));

  let changed = true;
  while (changed) {
    changed = false;
    for (const e of nestedEdges) {
      if (e.nestedId && groupIds.has(e.nestedId) && !groupIds.has(e.containerGroupId)) {
        groupIds.add(e.containerGroupId);
        changed = true;
      }
    }
  }

  return [...groupIds];
}

/**
 * Même règle que {@link getWorkspaceGroupIdsForUserEmail}, en une passe pour plusieurs e-mails
 * (admin UBAC — évite N requêtes).
 */
export async function getWorkspaceGroupIdsByEmailLowerBatch(
  emailsLower: readonly string[],
): Promise<WorkspaceGroupIdsByEmailLower> {
  const want = new Set(emailsLower.map((e) => e.trim().toLowerCase()).filter(Boolean));
  const out: WorkspaceGroupIdsByEmailLower = new Map();

  if (want.size === 0) return out;

  const userMembers = await db
    .select({
      memberUserEmail: workspaceGroupMember.memberUserEmail,
      containerGroupId: workspaceGroupMember.containerGroupId,
    })
    .from(workspaceGroupMember)
    .where(eq(workspaceGroupMember.memberKind, "user"));

  const nestedEdges = await db
    .select({
      containerGroupId: workspaceGroupMember.containerGroupId,
      nestedId: workspaceGroupMember.memberNestedGroupId,
    })
    .from(workspaceGroupMember)
    .where(eq(workspaceGroupMember.memberKind, "group"));

  const directByEmail = new Map<string, Set<string>>();
  for (const row of userMembers) {
    const em = row.memberUserEmail?.trim().toLowerCase();
    if (!em || !want.has(em)) continue;
    const s = directByEmail.get(em) ?? new Set();
    s.add(row.containerGroupId);
    directByEmail.set(em, s);
  }

  function expand(initial: Set<string>): string[] {
    const groupIds = new Set(initial);
    let changed = true;
    while (changed) {
      changed = false;
      for (const e of nestedEdges) {
        if (e.nestedId && groupIds.has(e.nestedId) && !groupIds.has(e.containerGroupId)) {
          groupIds.add(e.containerGroupId);
          changed = true;
        }
      }
    }
    return [...groupIds];
  }

  for (const em of want) {
    const initial = directByEmail.get(em) ?? new Set();
    out.set(em, expand(initial));
  }

  return out;
}
