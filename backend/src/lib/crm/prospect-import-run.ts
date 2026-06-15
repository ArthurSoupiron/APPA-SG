import { db } from "../../db";
import { prospect, prospectStatusLog, sprintProspect } from "../../db/schema";
import { rowToProspect } from "./prospect-import-parse";

const INSERT_CHUNK = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function runGlobalProspectImport(opts: {
  rows: Record<string, string>[];
  userId: string;
}): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const { rows, userId } = opts;
  let skipped = 0;
  const errors: string[] = [];

  type ProspectInsert = typeof prospect.$inferInsert;
  type StatusLogInsert = typeof prospectStatusLog.$inferInsert;

  const prospects: ProspectInsert[] = [];
  const logs: StatusLogInsert[] = [];

  for (const row of rows) {
    try {
      const fields = rowToProspect(row);
      if (!fields.nom || fields.nom === "?") {
        skipped++;
        continue;
      }
      const id = Bun.randomUUIDv7();
      const statut = fields.statut ?? "a_contacter";
      prospects.push({ id, ...fields, statut, source: fields.source ?? "apollo", createdBy: userId });
      logs.push({
        id: Bun.randomUUIDv7(),
        prospectId: id,
        userId,
        oldStatus: null,
        newStatus: statut,
      });
    } catch (e) {
      errors.push(String(e));
      skipped++;
    }
  }

  for (let i = 0; i < prospects.length; i += INSERT_CHUNK) {
    const pChunk = prospects.slice(i, i + INSERT_CHUNK);
    const lChunk = logs.slice(i, i + INSERT_CHUNK);
    await db.transaction(async (tx) => {
      await tx.insert(prospect).values(pChunk);
      await tx.insert(prospectStatusLog).values(lChunk);
    });
  }

  return { imported: prospects.length, skipped, errors: errors.slice(0, 10) };
}

export async function runSprintProspectImport(opts: {
  rows: Record<string, string>[];
  userId: string;
  sprintId: string;
  assignedUserId: string | null;
}): Promise<{ imported: number; skipped: number }> {
  const { rows, userId, sprintId, assignedUserId } = opts;
  let skipped = 0;

  type ProspectInsert = typeof prospect.$inferInsert;
  type StatusLogInsert = typeof prospectStatusLog.$inferInsert;
  type SprintLinkInsert = typeof sprintProspect.$inferInsert;

  const prospects: ProspectInsert[] = [];
  const logs: StatusLogInsert[] = [];
  const links: SprintLinkInsert[] = [];

  for (const row of rows) {
    try {
      const fields = rowToProspect(row);
      if (!fields.nom || fields.nom === "?") {
        skipped++;
        continue;
      }

      const pid = Bun.randomUUIDv7();
      const statut = fields.statut ?? "a_contacter";

      prospects.push({
        id: pid,
        ...fields,
        statut,
        source: fields.source ?? "import-sprint",
        createdBy: userId,
      });
      logs.push({
        id: Bun.randomUUIDv7(),
        prospectId: pid,
        userId,
        oldStatus: null,
        newStatus: statut,
      });
      links.push({
        sprintId,
        prospectId: pid,
        assignedUserId,
      });
    } catch {
      skipped++;
    }
  }

  for (let i = 0; i < prospects.length; i += INSERT_CHUNK) {
    const pChunk = prospects.slice(i, i + INSERT_CHUNK);
    const lChunk = logs.slice(i, i + INSERT_CHUNK);
    const linkChunk = links.slice(i, i + INSERT_CHUNK);
    await db.transaction(async (tx) => {
      await tx.insert(prospect).values(pChunk);
      await tx.insert(prospectStatusLog).values(lChunk);
      await tx.insert(sprintProspect).values(linkChunk).onConflictDoNothing();
    });
  }

  return { imported: prospects.length, skipped };
}
