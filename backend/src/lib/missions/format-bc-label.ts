import type { BonCommandeType } from "../../db/schema/mission/enums";

export function formatBcDisplayLabel(type: BonCommandeType, bcNumber: string): string {
  const prefix = type === "BCR" ? "BCR" : "BC";
  return `${prefix} ${bcNumber}`;
}
