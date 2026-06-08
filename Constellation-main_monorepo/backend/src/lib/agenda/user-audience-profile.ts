import { eq } from "drizzle-orm";

import { db } from "../../db";
import { workspaceGroup } from "../../db/schema";
import { getAgendaEnv } from "./agenda-env";

export type UserAudienceProfile = {
  isMandat: boolean;
  isIntervenant: boolean;
  isExterne: boolean;
};

let cachedIntervenantsGroupId: string | null | undefined;

async function resolveIntervenantsGroupId(): Promise<string | null> {
  if (cachedIntervenantsGroupId !== undefined) return cachedIntervenantsGroupId;
  const email = getAgendaEnv().intervenantsGroupEmail;
  if (!email) {
    cachedIntervenantsGroupId = null;
    return null;
  }
  const [row] = await db
    .select({ id: workspaceGroup.id })
    .from(workspaceGroup)
    .where(eq(workspaceGroup.email, email))
    .limit(1);
  cachedIntervenantsGroupId = row?.id ?? null;
  return cachedIntervenantsGroupId;
}

export async function buildUserAudienceProfile(
  userEmail: string,
  workspaceGroupIds: string[],
): Promise<UserAudienceProfile> {
  const domain = getAgendaEnv().mandatEmailDomain;
  const lower = userEmail.trim().toLowerCase();
  const isMandat = lower.endsWith(`@${domain}`);
  const intervenantsGroupId = await resolveIntervenantsGroupId();
  const isIntervenant = intervenantsGroupId
    ? workspaceGroupIds.includes(intervenantsGroupId)
    : false;
  const isExterne = !isMandat;
  return { isMandat, isIntervenant, isExterne };
}

export function audienceMatchesProfile(
  audiences: readonly string[],
  profile: UserAudienceProfile,
): boolean {
  if (audiences.includes("mandat") && profile.isMandat) return true;
  if (audiences.includes("intervenants") && profile.isIntervenant) return true;
  if (audiences.includes("externes") && profile.isExterne) return true;
  return false;
}
