import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import {
  assocConformiteCheck,
  assocDeadline,
  assocDocument,
  assocMember,
} from "../../db/schema";
import type { AppVariables } from "../../types/app";
import {
  asArray,
  asBool,
  asInt,
  asString,
  asStringArray,
  denyUnlessAuthenticated,
  readJsonBody,
} from "./helpers";

/**
 * État complet du module SG (membres, documents, échéances, conformité).
 * Le store front charge cet état au montage (GET) et le persiste (PUT).
 * Le PUT remplace tout l'état dans une transaction et déduplique les membres
 * par email (pas de doublon de fiche, cf. cahier des charges SG).
 */
export function registerAssocStateRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get("/state", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;

    const [members, documents, deadlines, conformite] = await Promise.all([
      db.select().from(assocMember),
      db.select().from(assocDocument),
      db.select().from(assocDeadline),
      db.select().from(assocConformiteCheck),
    ]);

    return c.json({
      members: members.map((m) => ({
        id: m.id,
        first: m.first,
        last: m.last,
        initials: m.initials,
        role: m.role,
        pole: m.pole,
        promo: m.promo,
        year: m.year,
        status: m.status,
        email: m.email,
        phone: m.phone,
        joined: m.joined,
        city: m.city,
        address: m.address ?? undefined,
        studentId: m.studentId ?? undefined,
        jeeceId: m.jeeceId ?? undefined,
        birth: m.birth ?? undefined,
        docs: m.docs ?? {},
        mandates: m.mandates ?? [],
      })),
      docs: documents.map((d) => ({
        id: d.id,
        title: d.title,
        cat: d.cat,
        pages: d.pages,
        format: d.format,
        size: d.size,
        mandat: d.mandat,
        ref: d.ref,
        status: d.status,
        author: d.author,
        signers: d.signers ?? [],
        date: d.date,
        dateAbs: d.dateAbs,
        tags: d.tags ?? [],
        security: d.security,
        fav: d.fav,
        driveFileId: d.driveFileId ?? undefined,
        driveWebViewLink: d.driveWebViewLink ?? undefined,
        signature: d.signatureData ?? undefined,
        signedBy: d.signedBy ?? undefined,
        signedAt: d.signedAt ?? undefined,
      })),
      deadlines: deadlines.map((d) => ({
        id: d.id,
        date: d.date,
        title: d.title,
        sub: d.sub,
        kind: d.kind,
      })),
      conformite: conformite.map((c2) => ({
        id: c2.id,
        k: c2.k,
        s: c2.s,
        state: c2.state,
        ref: c2.ref,
      })),
    });
  });

  router.put("/state", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;

    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "bad_request" }, 400);

    // --- Membres : dédup par email ---
    const seenEmail = new Set<string>();
    const memberRows = asArray(body.members)
      .map((raw) => {
        const m = raw as Record<string, unknown>;
        return {
          id: asString(m.id) || crypto.randomUUID(),
          first: asString(m.first),
          last: asString(m.last),
          initials: asString(m.initials, "?"),
          role: asString(m.role, "Membre actif"),
          pole: asString(m.pole, "SI"),
          promo: asInt(m.promo, new Date().getFullYear() + 2),
          year: asString(m.year, "L1"),
          status: asString(m.status, "active"),
          email: asString(m.email),
          phone: asString(m.phone, "—"),
          joined: asString(m.joined, "—"),
          city: asString(m.city, "—"),
          address: asString(m.address) || null,
          studentId: asString(m.studentId) || null,
          jeeceId: asString(m.jeeceId) || null,
          birth: asString(m.birth) || null,
          docs: (m.docs ?? {}) as Record<string, string>,
          mandates: asArray(m.mandates),
        };
      })
      .filter((m) => {
        const e = m.email.toLowerCase().trim();
        if (!e) return true;
        if (seenEmail.has(e)) return false;
        seenEmail.add(e);
        return true;
      });

    const docRows = asArray(body.docs).map((raw) => {
      const d = raw as Record<string, unknown>;
      return {
        id: asString(d.id) || crypto.randomUUID(),
        title: asString(d.title),
        cat: asString(d.cat, "cr"),
        pages: asInt(d.pages, 1),
        format: asString(d.format, "PDF"),
        size: asString(d.size, "—"),
        mandat: asString(d.mandat, "25–26"),
        ref: asString(d.ref, "DOC"),
        status: asString(d.status, "pending"),
        author: asString(d.author),
        signers: asStringArray(d.signers),
        date: asString(d.date),
        dateAbs: asString(d.dateAbs),
        tags: asStringArray(d.tags),
        security: asString(d.security, "Interne"),
        fav: asBool(d.fav),
        driveFileId: asString(d.driveFileId) || null,
        driveWebViewLink: asString(d.driveWebViewLink) || null,
        signatureData: asString(d.signature) || null,
        signedBy: asString(d.signedBy) || null,
        signedAt: asString(d.signedAt) || null,
      };
    });

    const deadlineRows = asArray(body.deadlines).map((raw) => {
      const d = raw as Record<string, unknown>;
      return {
        id: asString(d.id) || crypto.randomUUID(),
        date: asString(d.date),
        title: asString(d.title),
        sub: asString(d.sub),
        kind: asString(d.kind),
      };
    });

    const conformiteRows = asArray(body.conformite).map((raw) => {
      const c2 = raw as Record<string, unknown>;
      return {
        id: asString(c2.id) || crypto.randomUUID(),
        k: asString(c2.k),
        s: asString(c2.s),
        state: asString(c2.state, "todo"),
        ref: asString(c2.ref) || null,
      };
    });

    await db.transaction(async (tx) => {
      await tx.delete(assocMember);
      await tx.delete(assocDocument);
      await tx.delete(assocDeadline);
      await tx.delete(assocConformiteCheck);
      if (memberRows.length) await tx.insert(assocMember).values(memberRows);
      if (docRows.length) await tx.insert(assocDocument).values(docRows);
      if (deadlineRows.length) await tx.insert(assocDeadline).values(deadlineRows);
      if (conformiteRows.length) await tx.insert(assocConformiteCheck).values(conformiteRows);
    });

    return c.json({ success: true });
  });

  app.route("/api/app/assoc", router);
}
