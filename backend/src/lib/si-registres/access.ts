import type { Context } from "hono";

import type { AppVariables } from "../../types/app";
import { can } from "../ubac-http";

export function canViewSiRegistres(c: Context<{ Variables: AppVariables }>): boolean {
  return can(c, "si.registres.read");
}

export function canMutateSiRegistres(c: Context<{ Variables: AppVariables }>): boolean {
  return can(c, "si.registres.write");
}

export function canDeleteSiRegistres(c: Context<{ Variables: AppVariables }>): boolean {
  return can(c, "si.registres.delete");
}
