import { describe, expect, test } from "bun:test";

import { createApp } from "../../app";
import {
  canGenerateDoc,
  canManageBcStructure,
  canReadMissions,
  canValidateDoc,
  resolveGestionnaireMissionsPermissions,
} from "../../lib/missions/mission-permissions";

describe("missions API — auth", () => {
  const app = createApp();

  test("GET /api/app/missions sans session → 401", async () => {
    const res = await app.request("/api/app/missions");
    expect(res.status).toBe(401);
  });

  test("GET /api/app/missions/kpi sans session → 401", async () => {
    const res = await app.request("/api/app/missions/kpi");
    expect(res.status).toBe(401);
  });

  test("GET /api/app/missions/permissions/me sans session → 401", async () => {
    const res = await app.request("/api/app/missions/permissions/me");
    expect(res.status).toBe(401);
  });

  test("POST /api/app/missions sans session → 401", async () => {
    const res = await app.request("/api/app/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionName: "Test" }),
    });
    expect(res.status).toBe(401);
  });
});

describe("missions permissions UBAC ERP", () => {
  test("utilisateur sans droit ne peut pas lire", () => {
    expect(canReadMissions([], "user-1")).toBe(false);
  });

  test("erp.read autorise la lecture", () => {
    expect(canReadMissions(["erp.read"], "user-1")).toBe(true);
  });

  test("super-admin a tous les droits structure", () => {
    const adminId = process.env.ADMIN_USER_IDS?.split(",")[0]?.trim();
    if (!adminId) return;
    expect(canManageBcStructure([], adminId)).toBe(true);
    const perms = resolveGestionnaireMissionsPermissions(adminId, []);
    expect(perms.canManageBcStructure).toBe(true);
    expect(perms.canGenerateTemplates).toBe(true);
  });

  test("erp.mission.manage autorise mutations structure", () => {
    expect(canManageBcStructure(["erp.mission.manage"], "u")).toBe(true);
    expect(canManageBcStructure(["erp.read"], "u")).toBe(false);
  });

  test("permissions doc par type", () => {
    expect(canGenerateDoc(["erp.doc.generate.bc"], "u", "BC")).toBe(true);
    expect(canGenerateDoc(["erp.doc.generate.cca"], "u", "BC")).toBe(false);
    expect(canValidateDoc(["erp.doc.validate.rmi"], "u", "RMI")).toBe(true);
    const perms = resolveGestionnaireMissionsPermissions("u", [
      "erp.read",
      "erp.doc.generate.bc",
      "erp.doc.validate.bc",
    ]);
    expect(perms.canGenerateByDoc.BC).toBe(true);
    expect(perms.canGenerateByDoc.CCA).toBe(false);
    expect(perms.canValidateByDoc.BC).toBe(true);
  });
});
