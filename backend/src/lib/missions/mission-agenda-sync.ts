import { and, eq, isNull } from "drizzle-orm";

import { db } from "../../db";
import { agendaEvent } from "../../db/schema";
import { getCcaById } from "./repositories/cca";
import { listBonCommandeByCca } from "./repositories/bon-commande";
import { listRmiByBc } from "./repositories/rmi";

type MilestoneKind =
  | "mission_start"
  | "mission_end"
  | "bc_planning_start"
  | "bc_planning_end"
  | "rmi_meeting";

function dayBounds(date: Date): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date(date);
  startsAt.setHours(9, 0, 0, 0);
  const endsAt = new Date(date);
  endsAt.setHours(17, 0, 0, 0);
  return { startsAt, endsAt };
}

async function upsertMilestone(input: {
  missionId: string;
  milestoneKind: MilestoneKind;
  missionBcId: string | null;
  title: string;
  startsAt: Date;
  endsAt: Date;
  userId: string;
}) {
  const conditions = [
    eq(agendaEvent.missionId, input.missionId),
    eq(agendaEvent.milestoneKind, input.milestoneKind),
    isNull(agendaEvent.deletedAt),
  ];
  if (input.missionBcId) {
    conditions.push(eq(agendaEvent.missionBcId, input.missionBcId));
  }

  const [existing] = await db
    .select({ id: agendaEvent.id })
    .from(agendaEvent)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    await db
      .update(agendaEvent)
      .set({
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        updatedByUserId: input.userId,
        updatedAt: new Date(),
      })
      .where(eq(agendaEvent.id, existing.id));
    return;
  }

  const ref = `mission-${input.missionId}-${input.milestoneKind}${input.missionBcId ? `-${input.missionBcId}` : ""}`;
  await db.insert(agendaEvent).values({
    id: crypto.randomUUID(),
    reference: ref,
    pole: "operations",
    typeId: "agenda-type-operations-mission",
    title: input.title,
    description: "",
    status: "draft",
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    allDay: false,
    missionId: input.missionId,
    milestoneKind: input.milestoneKind,
    missionBcId: input.missionBcId,
    createdByUserId: input.userId,
    updatedByUserId: input.userId,
  });
}

/**
 * Synchronise les jalons agenda liés à une mission (début/fin mission, planning BC, RMI).
 */
export async function syncMissionAgendaMilestones(
  missionId: string,
  userId: string,
): Promise<void> {
  const mission = await getCcaById(missionId);
  if (!mission) return;

  if (mission.startDate) {
    const { startsAt, endsAt } = dayBounds(mission.startDate);
    await upsertMilestone({
      missionId,
      milestoneKind: "mission_start",
      missionBcId: null,
      title: `Début mission — ${mission.missionName}`,
      startsAt,
      endsAt,
      userId,
    });
  }

  if (mission.endDate) {
    const { startsAt, endsAt } = dayBounds(mission.endDate);
    await upsertMilestone({
      missionId,
      milestoneKind: "mission_end",
      missionBcId: null,
      title: `Fin mission — ${mission.missionName}`,
      startsAt,
      endsAt,
      userId,
    });
  }

  const bcs = await listBonCommandeByCca(missionId);
  for (const bc of bcs) {
    if (bc.planningDate) {
      const { startsAt, endsAt } = dayBounds(bc.planningDate);
      await upsertMilestone({
        missionId,
        milestoneKind: "bc_planning_start",
        missionBcId: bc.id,
        title: `Planning BC ${bc.bcNumber} — début`,
        startsAt,
        endsAt,
        userId,
      });
    }
    if (bc.planningEndDate) {
      const { startsAt, endsAt } = dayBounds(bc.planningEndDate);
      await upsertMilestone({
        missionId,
        milestoneKind: "bc_planning_end",
        missionBcId: bc.id,
        title: `Planning BC ${bc.bcNumber} — fin`,
        startsAt,
        endsAt,
        userId,
      });
    }

    const rmis = await listRmiByBc(bc.id);
    for (const rmi of rmis) {
      if (!rmi.meetingDate) continue;
      const { startsAt, endsAt } = dayBounds(rmi.meetingDate);
      await upsertMilestone({
        missionId,
        milestoneKind: "rmi_meeting",
        missionBcId: bc.id,
        title: `RMI ${rmi.rmiNumber} — ${mission.missionName}`,
        startsAt,
        endsAt,
        userId,
      });
    }
  }
}
