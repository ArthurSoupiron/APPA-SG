import { and, eq } from "drizzle-orm";

import { db } from "../../db";
import type { ProspectStatus } from "../../db/schema";
import { prospect, prospectStatusLog, sprintProspect } from "../../db/schema";
import { prospectNoteBodyExceedsLimit } from "./prospect-field-limits";
import { isValidProspectStatus } from "./prospect-import-parse";
import {
  insertProspectFicheFieldAudit,
  insertProspectNoteFromNotesPatch,
} from "./prospect-patch-side-effects";

export async function patchSprintProspectFiche(args: {
  sprintId: string;
  prospectId: string;
  userId: string;
  body: Record<string, unknown>;
  isManager: boolean;
  isAssigned: boolean;
}): Promise<
  | { ok: true; prospect: typeof prospect.$inferSelect; updated: string[] }
  | { ok: false; status: number; body: Record<string, unknown> }
> {
  const { sprintId, prospectId, userId, body, isManager, isAssigned } = args;

  const updates: string[] = [];

  if (isManager && body.assignedUserId !== undefined) {
    const newAssignee = typeof body.assignedUserId === "string" ? body.assignedUserId : null;
    await db
      .update(sprintProspect)
      .set({ assignedUserId: newAssignee })
      .where(and(eq(sprintProspect.sprintId, sprintId), eq(sprintProspect.prospectId, prospectId)));
    updates.push("assignation");
  }

  const [existingP] = await db.select().from(prospect).where(eq(prospect.id, prospectId));
  if (!existingP) return { ok: false, status: 404, body: { error: "not_found" } };

  const prospectPatch: Partial<typeof prospect.$inferInsert> = {};
  let statusChanged = false;

  if (isValidProspectStatus(body.statut) && body.statut !== existingP.statut) {
    prospectPatch.statut = body.statut;
    statusChanged = true;
  }

  if (isManager || isAssigned) {
    if (typeof body.nom === "string") {
      const t = body.nom.trim();
      if (t) prospectPatch.nom = t;
    }
    if (typeof body.prenom === "string") prospectPatch.prenom = body.prenom.trim() || undefined;
    if (typeof body.email === "string") prospectPatch.email = body.email.trim() || undefined;
    if (typeof body.telephone === "string")
      prospectPatch.telephone = body.telephone.trim() || undefined;
    if (typeof body.linkedin === "string")
      prospectPatch.linkedin = body.linkedin.trim() || undefined;
    if (typeof body.entreprise === "string")
      prospectPatch.entreprise = body.entreprise.trim() || undefined;
    if (typeof body.secteur === "string") prospectPatch.secteur = body.secteur.trim() || undefined;
    if (typeof body.source === "string") prospectPatch.source = body.source.trim() || undefined;
    if (typeof body.notes === "string") prospectPatch.notes = body.notes.trim() || undefined;
  }

  const ficheKeys = [
    "nom",
    "prenom",
    "email",
    "telephone",
    "linkedin",
    "entreprise",
    "secteur",
    "source",
    "notes",
  ] as const;
  const touchesFiche = ficheKeys.some((k) => k in prospectPatch);

  if (typeof prospectPatch.notes === "string") {
    const n = prospectPatch.notes;
    if (n.length > 0 && prospectNoteBodyExceedsLimit(n)) {
      return { ok: false, status: 413, body: { error: "notes_too_large" } };
    }
  }

  if (Object.keys(prospectPatch).length > 0) {
    await db.update(prospect).set(prospectPatch).where(eq(prospect.id, prospectId));
    if (typeof body.notes === "string") {
      await insertProspectNoteFromNotesPatch(body.notes, existingP, prospectId, userId);
    }
    await insertProspectFicheFieldAudit(existingP, prospectPatch, prospectId, userId);
    if (touchesFiche) updates.push("fiche");
    if (statusChanged) {
      await db.insert(prospectStatusLog).values({
        id: Bun.randomUUIDv7(),
        prospectId,
        userId,
        oldStatus: existingP.statut,
        newStatus: prospectPatch.statut as ProspectStatus,
      });
      updates.push("statut");
    }
  }

  if (updates.length === 0) return { ok: false, status: 400, body: { error: "nothing_to_update" } };

  const [updatedProspect] = await db.select().from(prospect).where(eq(prospect.id, prospectId));
  return { ok: true, prospect: updatedProspect!, updated: updates };
}
