import { and, asc, count, desc, eq, gte, isNotNull, lte } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import {
  crmSprint,
  prospect,
  prospectStatusLog,
  sprintMember,
  sprintProspect,
  user as userTable,
} from "../../db/schema";
import { can } from "../../lib/ubac-http";
import type { AppVariables } from "../../types/app";

function requireUser(c: {
  get: (k: "user") => AppVariables["user"];
  json: (b: unknown, s: number) => Response;
}) {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  return null;
}

/** Calcule les métriques KPI pour une liste de prospects. */
function computeMetrics(rows: { statut: string }[]) {
  const total = rows.length;
  const byStatus = new Map<string, number>();
  for (const r of rows) byStatus.set(r.statut, (byStatus.get(r.statut) ?? 0) + 1);

  const aContacter = byStatus.get("a_contacter") ?? 0;
  const aRecontacter = byStatus.get("a_recontacter") ?? 0;
  const contacte = byStatus.get("contacte") ?? 0;
  const rdvConfirme = byStatus.get("rdv_confirme") ?? 0;
  const enCours = byStatus.get("en_cours") ?? 0;
  const transforme = byStatus.get("transforme") ?? 0;
  const perdu = byStatus.get("perdu") ?? 0;

  const contactes = contacte + rdvConfirme + enCours + transforme;
  const tauxReponse = total > 0 ? Math.round((contactes / total) * 1000) / 10 : 0;
  const tauxTransformation = total > 0 ? Math.round((transforme / total) * 1000) / 10 : 0;

  const funnel = [
    { label: "À contacter", statut: "a_contacter", count: aContacter },
    { label: "À recontacter", statut: "a_recontacter", count: aRecontacter },
    { label: "Contacté", statut: "contacte", count: contacte },
    { label: "RDV confirmé", statut: "rdv_confirme", count: rdvConfirme },
    { label: "En cours", statut: "en_cours", count: enCours },
    { label: "Transformé", statut: "transforme", count: transforme },
    { label: "Perdu", statut: "perdu", count: perdu },
  ];

  return {
    total,
    aContacter,
    aRecontacter,
    contacte,
    rdvConfirme,
    enCours,
    transforme,
    perdu,
    tauxReponse,
    tauxTransformation,
    funnel,
  };
}

export function registerCrmKpiRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const r = new Hono<{ Variables: AppVariables }>();

  /** GET /kpi/me — KPI personnel (prospects assignés dans les sprints) */
  r.get("/kpi/me", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.kpi.read")) return c.json({ error: "forbidden", need: "crm.kpi.read" }, 403);

    const userId = c.get("user")!.id;

    // Prospects assignés à cet user dans tous les sprints
    const assignedRows = await db
      .select({ statut: prospect.statut })
      .from(sprintProspect)
      .innerJoin(prospect, eq(sprintProspect.prospectId, prospect.id))
      .where(eq(sprintProspect.assignedUserId, userId));

    const metrics = computeMetrics(assignedRows);

    // Sprints dont je suis membre
    const mySprintRows = await db
      .select({
        sprintId: sprintMember.sprintId,
        name: crmSprint.name,
        dateStart: crmSprint.dateStart,
        dateEnd: crmSprint.dateEnd,
      })
      .from(sprintMember)
      .innerJoin(crmSprint, eq(sprintMember.sprintId, crmSprint.id))
      .where(eq(sprintMember.userId, userId));

    return c.json({ ...metrics, sprints: mySprintRows });
  });

  /** GET /kpi/global — KPI globaux + classement par user */
  r.get("/kpi/global", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.kpi.global"))
      return c.json({ error: "forbidden", need: "crm.kpi.global" }, 403);

    // Tous les prospects
    const allProspects = await db.select({ statut: prospect.statut }).from(prospect);
    const totals = computeMetrics(allProspects);

    // Stats par user (basées sur les assignations sprint)
    const userAssignments = await db
      .select({
        userId: sprintProspect.assignedUserId,
        statut: prospect.statut,
      })
      .from(sprintProspect)
      .innerJoin(prospect, eq(sprintProspect.prospectId, prospect.id))
      .where(isNotNull(sprintProspect.assignedUserId));

    // Récupérer les noms d'users
    const allUsers = await db
      .select({ id: userTable.id, name: userTable.name, email: userTable.email })
      .from(userTable);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    // Agréger par user
    const byUser = new Map<string, { statut: string }[]>();
    for (const row of userAssignments) {
      if (!row.userId) continue;
      if (!byUser.has(row.userId)) byUser.set(row.userId, []);
      byUser.get(row.userId)!.push({ statut: row.statut });
    }

    const ranking = [...byUser.entries()]
      .map(([userId, rows]) => {
        const metrics = computeMetrics(rows);
        const u = userMap.get(userId);
        return { userId, userName: u?.name ?? "—", email: u?.email ?? "", ...metrics };
      })
      .sort((a, b) => b.transforme - a.transforme || b.rdvConfirme - a.rdvConfirme);

    return c.json({ totals, ranking });
  });

  /** GET /kpi/dashboard — données dashboard */
  r.get("/kpi/dashboard", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.kpi.global"))
      return c.json({ error: "forbidden", need: "crm.kpi.global" }, 403);

    // Plage de dates (défaut : 30 derniers jours)
    const fromParam = c.req.query("from");
    const toParam = c.req.query("to");
    const now = new Date();
    const from = fromParam
      ? new Date(fromParam)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    const to = toParam ? new Date(toParam) : now;

    // Timeline : activité par jour (nombre de mises à jour de statut)
    const logRows = await db
      .select({ createdAt: prospectStatusLog.createdAt })
      .from(prospectStatusLog)
      .where(and(gte(prospectStatusLog.createdAt, from), lte(prospectStatusLog.createdAt, to)));

    const timelineMap = new Map<string, number>();
    for (const row of logRows) {
      const day = row.createdAt.toISOString().slice(0, 10);
      timelineMap.set(day, (timelineMap.get(day) ?? 0) + 1);
    }
    const timeline: { date: string; count: number }[] = [];
    const cur = new Date(from);
    while (cur <= to) {
      const key = cur.toISOString().slice(0, 10);
      timeline.push({ date: key, count: timelineMap.get(key) ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }

    // Répartition statuts
    const statusRows = await db
      .select({ statut: prospect.statut, count: count() })
      .from(prospect)
      .groupBy(prospect.statut);

    // Répartition secteurs
    const sectorRows = await db
      .select({ secteur: prospect.secteur, count: count() })
      .from(prospect)
      .groupBy(prospect.secteur)
      .orderBy(desc(count()));

    // Top performers (transformations + RDV)
    const userAssignments = await db
      .select({ userId: sprintProspect.assignedUserId, statut: prospect.statut })
      .from(sprintProspect)
      .innerJoin(prospect, eq(sprintProspect.prospectId, prospect.id));

    const allUsers = await db.select({ id: userTable.id, name: userTable.name }).from(userTable);
    const userMap = new Map(allUsers.map((u) => [u.id, u.name]));

    const perf = new Map<string, { transforme: number; rdvConfirme: number; total: number }>();
    for (const row of userAssignments) {
      if (!row.userId) continue;
      if (!perf.has(row.userId)) perf.set(row.userId, { transforme: 0, rdvConfirme: 0, total: 0 });
      const p = perf.get(row.userId)!;
      p.total++;
      if (row.statut === "transforme") p.transforme++;
      if (row.statut === "rdv_confirme") p.rdvConfirme++;
    }

    const topPerformers = [...perf.entries()]
      .map(([userId, stats]) => ({ userId, userName: userMap.get(userId) ?? "—", ...stats }))
      .sort((a, b) => b.transforme - a.transforme || b.rdvConfirme - a.rdvConfirme)
      .slice(0, 10);

    // Recontacts : prospects en statut "contacte" non mis à jour depuis 7 jours
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recontacts = await db
      .select({
        id: prospect.id,
        nom: prospect.nom,
        prenom: prospect.prenom,
        email: prospect.email,
        entreprise: prospect.entreprise,
        updatedAt: prospect.updatedAt,
      })
      .from(prospect)
      .where(and(eq(prospect.statut, "contacte"), lte(prospect.updatedAt, sevenDaysAgo)))
      .orderBy(asc(prospect.updatedAt))
      .limit(20);

    // Sprints à venir (dateEnd >= maintenant)
    const upcomingSprints = await db
      .select()
      .from(crmSprint)
      .where(gte(crmSprint.dateEnd, now))
      .orderBy(asc(crmSprint.dateStart))
      .limit(5);

    return c.json({
      timeline,
      statusDistribution: statusRows.map((r) => ({ statut: r.statut, count: Number(r.count) })),
      sectorDistribution: sectorRows.map((r) => ({
        secteur: r.secteur ?? "Non renseigné",
        count: Number(r.count),
      })),
      topPerformers,
      recontacts,
      upcomingSprints,
    });
  });

  /** GET /kpi/sprint/:id — KPI d'un sprint (membres + agrégats) */
  r.get("/kpi/sprint/:id", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;

    const sprintId = c.req.param("id");
    const userId = c.get("user")!.id;

    // KPI global du sprint → crm.kpi.global ; KPI de "mon sprint" → crm.kpi.read + appartenance
    const hasGlobal = can(c, "crm.kpi.global");
    const hasPersonal = can(c, "crm.kpi.read");
    if (!hasGlobal && !hasPersonal)
      return c.json({ error: "forbidden", need: "crm.kpi.read" }, 403);

    const [sprint] = await db.select().from(crmSprint).where(eq(crmSprint.id, sprintId));
    if (!sprint) return c.json({ error: "not_found" }, 404);

    // Si pas global, vérifier appartenance
    if (!hasGlobal) {
      const [member] = await db
        .select({ userId: sprintMember.userId })
        .from(sprintMember)
        .where(and(eq(sprintMember.sprintId, sprintId), eq(sprintMember.userId, userId)));
      if (!member && sprint.createdBy !== userId) return c.json({ error: "forbidden" }, 403);
    }

    // Toutes les assignations dans ce sprint
    const assignments = await db
      .select({ assignedUserId: sprintProspect.assignedUserId, statut: prospect.statut })
      .from(sprintProspect)
      .innerJoin(prospect, eq(sprintProspect.prospectId, prospect.id))
      .where(eq(sprintProspect.sprintId, sprintId));

    // Totaux du sprint
    const totals = computeMetrics(assignments.map((a) => ({ statut: a.statut })));

    // Par membre
    const allUsers = await db
      .select({ id: userTable.id, name: userTable.name, email: userTable.email })
      .from(userTable);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    const byUser = new Map<string, { statut: string }[]>();
    for (const row of assignments) {
      if (!row.assignedUserId) continue;
      if (!byUser.has(row.assignedUserId)) byUser.set(row.assignedUserId, []);
      byUser.get(row.assignedUserId)!.push({ statut: row.statut });
    }

    const members = [...byUser.entries()]
      .map(([uid, rows]) => ({
        userId: uid,
        userName: userMap.get(uid)?.name ?? "—",
        email: userMap.get(uid)?.email ?? "",
        ...computeMetrics(rows),
      }))
      .sort((a, b) => b.transforme - a.transforme);

    return c.json({ sprint, totals, members });
  });

  app.route("/api/app/crm", r);
}
