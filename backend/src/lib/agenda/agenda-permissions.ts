import type { AgendaPole } from "../../db/schema/agenda/poles";
import type { Permission } from "../../ubac";

export function agendaPoleWritePermission(pole: AgendaPole): Permission {
  return `${pole}.agenda.write` as Permission;
}

export function agendaPoleManagePermission(pole: AgendaPole): Permission {
  return `${pole}.agenda.manage` as Permission;
}

export function agendaPoleDeletePermission(pole: AgendaPole): Permission {
  return `${pole}.agenda.delete` as Permission;
}
