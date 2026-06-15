import type { AgendaPole } from "../../db/schema/agenda/poles";
import type { Permission } from "../../ubac";

export function agendaPoleWritePermission(pole: AgendaPole): Permission {
  return `agenda.${pole}.write` as Permission;
}

export function agendaPoleManagePermission(pole: AgendaPole): Permission {
  return `agenda.${pole}.manage` as Permission;
}

export function agendaPoleDeletePermission(pole: AgendaPole): Permission {
  return `agenda.${pole}.delete` as Permission;
}
