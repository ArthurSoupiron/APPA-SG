import { db } from "../../db";
import { crmAuditLog, type prospect, prospectNote } from "../../db/schema";

export const CRM_PROSPECT_FICHE_AUDIT_FIELDS = [
  "nom",
  "prenom",
  "email",
  "emailSecondaire",
  "telephone",
  "telephoneMobile",
  "linkedin",
  "entreprise",
  "secteur",
  "source",
  "titre",
  "ville",
  "pays",
] as const;

type ProspectRow = typeof prospect.$inferSelect;
type ProspectPatch = Partial<typeof prospect.$inferInsert>;

/** Après PATCH : une ligne `prospect_note` si le corps `notes` a changé (champ `body` = nouveau texte complet). */
export async function insertProspectNoteFromNotesPatch(
  bodyNotes: string,
  existing: ProspectRow,
  prospectId: string,
  userId: string,
): Promise<void> {
  const next = bodyNotes.trim();
  const prev = (existing.notes ?? "").trim();
  if (next === prev) return;
  await db.insert(prospectNote).values({
    id: Bun.randomUUIDv7(),
    prospectId,
    userId,
    body: next.length > 0 ? next : "(vide)",
  });
}

/** Journal d’audit pour les champs fiche (hors statut / notes). */
export async function insertProspectFicheFieldAudit(
  existing: ProspectRow,
  update: ProspectPatch,
  prospectId: string,
  userId: string,
): Promise<void> {
  const auditPatch: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of CRM_PROSPECT_FICHE_AUDIT_FIELDS) {
    if (key in update) {
      const from = existing[key];
      const to = update[key] ?? null;
      if (String(from ?? "") !== String(to ?? "")) {
        auditPatch[key] = { from, to };
      }
    }
  }
  if (Object.keys(auditPatch).length === 0) return;
  await db.insert(crmAuditLog).values({
    id: Bun.randomUUIDv7(),
    entityType: "prospect",
    entityId: prospectId,
    userId,
    action: "fields_update",
    payload: auditPatch,
  });
}
