import { db } from "../../../db";
import { missionRmiIntervenantAssignation } from "../../../db/schema";

export async function createRmiAssignation(values: {
  id: string;
  rmiId: string;
  intervenantId: string;
  designationId?: string | null;
}): Promise<void> {
  await db.insert(missionRmiIntervenantAssignation).values({
    id: values.id,
    rmiId: values.rmiId,
    intervenantId: values.intervenantId,
    designationId: values.designationId ?? null,
  });
}
