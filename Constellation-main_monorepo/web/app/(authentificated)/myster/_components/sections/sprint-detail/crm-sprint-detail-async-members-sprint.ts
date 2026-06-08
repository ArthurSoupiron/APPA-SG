import { isoToLocalYmd, localYmdToUtcIsoEnd, localYmdToUtcIsoStart } from "@myster/_lib/crm-day";
import { toast } from "sonner";

import type { Member, ProspectOpt, UserOpt } from "./crm-sprint-detail-types";

export async function sprintDetailAddMembers(
  id: string,
  addMemberId: string,
  load: () => Promise<void>,
  setAddMemberId: (v: string) => void,
): Promise<void> {
  if (!addMemberId) return;
  const res = await fetch(`/api/app/crm/sprints/${encodeURIComponent(id)}/members`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds: [addMemberId] }),
  });
  if (res.status === 403) {
    toast.error("Permission refusée (crm.sprint.manage).");
    return;
  }
  if (!res.ok) {
    toast.error("Ajout impossible.");
    return;
  }
  toast.success("Membre ajouté.");
  setAddMemberId("");
  await load();
}

export async function sprintDetailRemoveMember(
  id: string,
  uid: string,
  load: () => Promise<void>,
): Promise<void> {
  const res = await fetch(
    `/api/app/crm/sprints/${encodeURIComponent(id)}/members/${encodeURIComponent(uid)}`,
    { method: "DELETE", credentials: "include" },
  );
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return;
  }
  toast.success("Membre retiré.");
  await load();
}

export async function sprintDetailSaveEditSprint(
  id: string,
  editName: string,
  editTheme: string,
  editStart: string,
  editEnd: string,
  editPublic: boolean,
  setEditBusy: (v: boolean) => void,
  setEditOpen: (v: boolean) => void,
  load: () => Promise<void>,
): Promise<void> {
  if (!editName.trim()) {
    toast.error("Le nom est requis.");
    return;
  }
  if (editStart && editEnd && editEnd < editStart) {
    toast.error("La date de fin doit être au même jour ou après le début.");
    return;
  }
  setEditBusy(true);
  try {
    const body: Record<string, unknown> = {
      name: editName.trim(),
      theme: editTheme.trim(),
      isPublic: editPublic,
    };
    if (editStart) {
      const iso = localYmdToUtcIsoStart(editStart);
      if (iso) body.dateStart = iso;
    }
    if (editEnd) {
      const iso = localYmdToUtcIsoEnd(editEnd);
      if (iso) body.dateEnd = iso;
    }

    const res = await fetch(`/api/app/crm/sprints/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 403) {
      toast.error("Permission refusée.");
      return;
    }
    if (!res.ok) {
      toast.error("Enregistrement impossible.");
      return;
    }
    toast.success("Sprint mis à jour.");
    setEditOpen(false);
    await load();
  } finally {
    setEditBusy(false);
  }
}

export function sprintDetailOpenEditSprint(
  sprint: {
    name: string;
    theme: string | null;
    dateStart: string | null;
    dateEnd: string | null;
    isPublic: boolean;
  },
  setEditName: (v: string) => void,
  setEditTheme: (v: string) => void,
  setEditStart: (v: string) => void,
  setEditEnd: (v: string) => void,
  setEditPublic: (v: boolean) => void,
  setEditOpen: (v: boolean) => void,
): void {
  setEditName(sprint.name);
  setEditTheme(sprint.theme ?? "");
  setEditStart(isoToLocalYmd(sprint.dateStart));
  setEditEnd(isoToLocalYmd(sprint.dateEnd));
  setEditPublic(sprint.isPublic);
  setEditOpen(true);
}

export async function sprintDetailDeleteSprint(id: string, onBack: () => void): Promise<void> {
  if (!confirm("Supprimer ce sprint ?")) return;
  const res = await fetch(`/api/app/crm/sprints/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (res.status === 403) {
    toast.error("Permission refusée.");
    return;
  }
  toast.success("Sprint supprimé.");
  onBack();
}

export async function sprintDetailAddPickedProspects(
  id: string,
  pickIds: Set<string>,
  pickDefaultAssignee: string,
  setPickIds: (s: Set<string>) => void,
  setPickDefaultAssignee: (v: string) => void,
  setPickOpen: (v: boolean) => void,
  load: () => Promise<void>,
): Promise<void> {
  if (pickIds.size === 0) {
    setPickOpen(false);
    return;
  }
  const payload: { prospectIds: string[]; assignedUserId?: string } = {
    prospectIds: [...pickIds],
  };
  if (pickDefaultAssignee) payload.assignedUserId = pickDefaultAssignee;

  const res = await fetch(`/api/app/crm/sprints/${encodeURIComponent(id)}/prospects`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 403) {
    toast.error("Permission refusée (crm.sprint.manage).");
    return;
  }
  if (!res.ok) {
    toast.error("Ajout impossible.");
    return;
  }
  toast.success("Prospects ajoutés au sprint.");
  setPickIds(new Set());
  setPickDefaultAssignee("");
  setPickOpen(false);
  await load();
}

export async function sprintDetailLoadProspectsForPick(
  id: string,
  secteurFilter: string,
  CRM_SECTEUR_FILTER_ALL: string,
  setAllProspects: (p: ProspectOpt[]) => void,
): Promise<void> {
  if (!id) return;
  const params = new URLSearchParams();
  params.set("pageSize", "500");
  params.set("statuts", "a_contacter,a_recontacter");
  params.set("excludeSprintId", id);
  if (secteurFilter !== CRM_SECTEUR_FILTER_ALL) {
    params.set("secteur", secteurFilter);
    params.set("secteurExact", "1");
  }
  const res = await fetch(`/api/app/crm/prospects?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) return;
  const json: { prospects?: ProspectOpt[] } = await res.json();
  setAllProspects(json.prospects ?? []);
}

export function sprintDetailMemberIds(members: Member[]): Set<string> {
  return new Set(members.map((m) => m.userId));
}

export function sprintDetailUserOptions(allUsers: UserOpt[], memberIds: Set<string>): UserOpt[] {
  return allUsers.filter((u) => !memberIds.has(u.id));
}
