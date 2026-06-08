import type { SeedDb } from "../db-type";
import { AGENDA_POLES } from "../../schema/agenda/poles";
import { agendaEventType } from "../../schema";

const DEFAULT_TYPES: Record<string, { slug: string; label: string; color: string }[]> = {
  crm: [
    { slug: "rdv-prospect", label: "RDV prospect", color: "#2563eb" },
    { slug: "relance", label: "Relance", color: "#3b82f6" },
  ],
  marketing: [
    { slug: "campagne", label: "Campagne", color: "#db2777" },
    { slug: "communication", label: "Communication", color: "#ec4899" },
  ],
  rh: [
    { slug: "formation", label: "Formation", color: "#16a34a" },
    { slug: "onboarding", label: "Onboarding", color: "#22c55e" },
  ],
  si: [
    { slug: "maintenance", label: "Maintenance", color: "#7c3aed" },
    { slug: "deploiement", label: "Déploiement", color: "#8b5cf6" },
  ],
  tresorerie: [
    { slug: "echeance", label: "Échéance", color: "#ca8a04" },
    { slug: "reunion", label: "Réunion", color: "#eab308" },
  ],
  operations: [
    { slug: "mission", label: "Mission", color: "#0891b2" },
    { slug: "reunion", label: "Réunion", color: "#06b6d4" },
  ],
  presidence: [
    { slug: "bureau", label: "Bureau", color: "#b45309" },
    { slug: "ag", label: "Assemblée générale", color: "#d97706" },
  ],
  erp: [{ slug: "general", label: "Général", color: "#64748b" }],
  academy: [{ slug: "session", label: "Session", color: "#0d9488" }],
  rfp: [{ slug: "deadline", label: "Deadline", color: "#dc2626" }],
};

export async function seedAgendaEventTypes(db: SeedDb) {
  const rows = AGENDA_POLES.flatMap((pole) =>
    (DEFAULT_TYPES[pole] ?? [{ slug: "general", label: "Général", color: "#64748b" }]).map(
      (t, i) => ({
        id: `agenda-type-${pole}-${t.slug}`,
        pole,
        slug: t.slug,
        label: t.label,
        color: t.color,
        sortOrder: i,
        isActive: true,
      }),
    ),
  );

  for (const row of rows) {
    await db.insert(agendaEventType).values(row).onConflictDoNothing();
  }
}
