import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { user, workspaceGroup, workspaceGroupMember } from "../../db/schema";

const CDP_GROUP_EMAIL = "cdp@jeece.fr";

export type CdpFormOption = {
  id: string;
  label: string;
  email: string;
  hasAppUser: boolean;
};

/** Membres du groupe GW `cdp@jeece.fr` inscrits dans l'application (match e-mail). */
export async function getCdpFormOptions(): Promise<CdpFormOption[]> {
  const [group] = await db
    .select({ id: workspaceGroup.id })
    .from(workspaceGroup)
    .where(eq(workspaceGroup.email, CDP_GROUP_EMAIL))
    .limit(1);

  if (!group) return [];

  const members = await db
    .select({
      memberUserEmail: workspaceGroupMember.memberUserEmail,
      userId: user.id,
      userName: user.name,
    })
    .from(workspaceGroupMember)
    .leftJoin(
      user,
      sql`lower(${user.email}) = lower(${workspaceGroupMember.memberUserEmail})`,
    )
    .where(
      and(
        eq(workspaceGroupMember.containerGroupId, group.id),
        eq(workspaceGroupMember.memberKind, "user"),
      ),
    )
    .orderBy(asc(workspaceGroupMember.memberUserEmail));

  return members
    .filter((m) => m.memberUserEmail && m.userId)
    .map((m) => {
      const email = m.memberUserEmail!.trim().toLowerCase();
      return {
        id: m.userId!,
        label: m.userName?.trim() || email,
        email,
        hasAppUser: true,
      };
    });
}
