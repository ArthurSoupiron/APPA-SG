import type { Context } from "hono";

import { AGENDA_POLES, type AgendaAudience, type AgendaPole } from "../../db/schema/agenda/poles";
import { can } from "../ubac-http";
import { isSuperAdminUserId } from "../../ubac";
import type { AppVariables } from "../../types/app";
import {
  agendaPoleDeletePermission,
  agendaPoleManagePermission,
  agendaPoleWritePermission,
} from "./agenda-permissions";
import {
  audienceMatchesProfile,
  buildUserAudienceProfile,
  type UserAudienceProfile,
} from "./user-audience-profile";
import { getWorkspaceGroupIdsForUserEmail } from "../gw-group-membership";

type EventRow = {
  id: string;
  pole: AgendaPole;
  status: string;
  createdByUserId: string;
  deletedAt: Date | null;
};

export type AgendaAccessContext = {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
  profile: UserAudienceProfile;
  groupIds: string[];
  managedPoles: Set<AgendaPole>;
  writablePoles: Set<AgendaPole>;
  deletablePoles: Set<AgendaPole>;
};

function collectPoles(
  c: Context<{ Variables: AppVariables }>,
  kind: "write" | "manage" | "delete",
): Set<AgendaPole> {
  const out = new Set<AgendaPole>();
  for (const pole of AGENDA_POLES) {
    if (kind === "write") {
      if (can(c, agendaPoleWritePermission(pole))) out.add(pole);
      if (can(c, agendaPoleManagePermission(pole))) out.add(pole);
    } else if (kind === "manage") {
      if (can(c, agendaPoleManagePermission(pole))) out.add(pole);
    } else {
      if (can(c, agendaPoleDeletePermission(pole))) out.add(pole);
      if (can(c, agendaPoleManagePermission(pole))) out.add(pole);
    }
  }
  return out;
}

export async function buildAgendaAccessContext(
  c: Context<{ Variables: AppVariables }>,
): Promise<AgendaAccessContext | null> {
  const user = c.get("user");
  if (!user) return null;
  const email = user.email ?? "";
  const groupIds = await getWorkspaceGroupIdsForUserEmail(email);
  const profile = await buildUserAudienceProfile(email, groupIds);
  const isSuperAdmin = isSuperAdminUserId(user.id);
  return {
    userId: user.id,
    email: email.toLowerCase(),
    isSuperAdmin,
    profile,
    groupIds,
    managedPoles: isSuperAdmin ? new Set(AGENDA_POLES) : collectPoles(c, "manage"),
    writablePoles: isSuperAdmin ? new Set(AGENDA_POLES) : collectPoles(c, "write"),
    deletablePoles: isSuperAdmin ? new Set(AGENDA_POLES) : collectPoles(c, "delete"),
  };
}

export function canManagePole(access: AgendaAccessContext, pole: AgendaPole): boolean {
  return access.isSuperAdmin || access.managedPoles.has(pole);
}

export function canWritePole(access: AgendaAccessContext, pole: AgendaPole): boolean {
  return access.isSuperAdmin || access.writablePoles.has(pole);
}

export function canViewEvent(
  access: AgendaAccessContext,
  event: EventRow,
  audiences: AgendaAudience[],
  audienceGroupIds: string[],
  opts: { isParticipant: boolean },
): boolean {
  if (event.deletedAt && !access.isSuperAdmin) return false;
  if (access.isSuperAdmin) return true;
  if (canManagePole(access, event.pole)) return true;
  if (event.createdByUserId === access.userId) return true;
  if (opts.isParticipant) return true;

  if (event.status === "draft") {
    return event.createdByUserId === access.userId;
  }

  if (audienceGroupIds.some((gid) => access.groupIds.includes(gid))) return true;
  if (audiences.length > 0 && audienceMatchesProfile(audiences, access.profile)) return true;
  return false;
}

export function canEditEvent(access: AgendaAccessContext, event: EventRow): boolean {
  if (event.deletedAt) return false;
  if (access.isSuperAdmin) return true;
  if (canManagePole(access, event.pole)) return true;
  return event.createdByUserId === access.userId && canWritePole(access, event.pole);
}

export function canDeletePole(access: AgendaAccessContext, pole: AgendaPole): boolean {
  return access.isSuperAdmin || access.deletablePoles.has(pole);
}

export function canDeleteEvent(access: AgendaAccessContext, event: EventRow): boolean {
  if (event.deletedAt) return false;
  return canDeletePole(access, event.pole);
}

export function canReadAgenda(c: Context<{ Variables: AppVariables }>): boolean {
  const user = c.get("user");
  if (!user) return false;
  if (isSuperAdminUserId(user.id)) return true;
  return can(c, "agenda.read");
}
