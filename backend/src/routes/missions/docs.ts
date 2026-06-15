import type { Hono } from "hono";

import {
  createBvDoc,
  createBvPerIntervenant,
  createFa,
  createFs,
  createPvrfDoc,
  createQsDoc,
  createRmiDoc,
  createRmiPerIntervenant,
  updateBvDoc,
  updateFaDoc,
  updateFsDoc,
  updatePvrfDoc,
  updateQsDoc,
  updateRmiDoc,
} from "../../lib/missions/mutation-service";
import type { AppVariables } from "../../types/app";
import { mutationErrorResponse, requireBcStructure, requireUser } from "./helpers";

type DocHandler = (
  missionId: string,
  bcId: string,
  userId: string,
  data: Record<string, unknown>,
) => Promise<void>;

type DocUpdateHandler = (
  missionId: string,
  bcId: string,
  docId: string,
  userId: string,
  data: Record<string, unknown>,
  reason?: string,
) => Promise<void>;

export function registerMissionsDocRoutes(app: Hono<{ Variables: AppVariables }>) {
  const routes: Array<{ path: string; create: DocHandler; update?: DocUpdateHandler }> = [
    {
      path: "fa",
      create: (m, b, u, d) => createFa(m, b, u, d as never),
      update: (m, b, id, u, d, r) => updateFaDoc(m, b, id, u, d as never, r),
    },
    {
      path: "fs",
      create: (m, b, u, d) => createFs(m, b, u, d as never),
      update: (m, b, id, u, d, r) => updateFsDoc(m, b, id, u, d as never, r),
    },
    {
      path: "rmi",
      create: (m, b, u, d) => createRmiDoc(m, b, u, d as never),
      update: (m, b, id, u, d, r) => updateRmiDoc(m, b, id, u, d as never, r),
    },
    {
      path: "bv",
      create: (m, b, u, d) => createBvDoc(m, b, u, d as never),
      update: (m, b, id, u, d, r) => updateBvDoc(m, b, id, u, d as never, r),
    },
    {
      path: "pvrf",
      create: (m, b, u, d) => createPvrfDoc(m, b, u, d as never),
      update: (m, b, id, u, d, r) => updatePvrfDoc(m, b, id, u, d as never, r),
    },
    {
      path: "qs",
      create: (m, b, u, d) => createQsDoc(m, b, u, d as never),
      update: (m, b, id, u, d, r) => updateQsDoc(m, b, id, u, d as never, r),
    },
  ];

  for (const { path, create, update } of routes) {
    app.post(`/missions/:missionId/bcs/:bcId/${path}`, async (c) => {
      const deny = requireUser(c);
      if (deny) return deny;
      const perm = requireBcStructure(c);
      if (perm) return perm;
      const user = c.get("user")!;
      const body = (await c.req.json()) as Record<string, unknown>;
      try {
        await create(c.req.param("missionId"), c.req.param("bcId"), user.id, body);
        return c.body(null, 204);
      } catch (e) {
        return mutationErrorResponse(c, e);
      }
    });

    if (update) {
      app.patch(`/missions/:missionId/bcs/:bcId/${path}/:docId`, async (c) => {
        const deny = requireUser(c);
        if (deny) return deny;
        const perm = requireBcStructure(c);
        if (perm) return perm;
        const user = c.get("user")!;
        const body = (await c.req.json()) as Record<string, unknown> & { reason?: string };
        try {
          await update(
            c.req.param("missionId"),
            c.req.param("bcId"),
            c.req.param("docId"),
            user.id,
            body,
            body.reason,
          );
          return c.body(null, 204);
        } catch (e) {
          return mutationErrorResponse(c, e);
        }
      });
    }
  }

  app.post("/missions/:missionId/bcs/:bcId/rmi/per-intervenant", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireBcStructure(c);
    if (perm) return perm;
    const user = c.get("user")!;
    const body = (await c.req.json()) as { baseNumber?: string };
    try {
      const result = await createRmiPerIntervenant(
        c.req.param("missionId"),
        c.req.param("bcId"),
        user.id,
        body.baseNumber ?? "RMI",
      );
      return c.json(result);
    } catch (e) {
      return mutationErrorResponse(c, e);
    }
  });

  app.post("/missions/:missionId/bcs/:bcId/bv/per-intervenant", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireBcStructure(c);
    if (perm) return perm;
    const user = c.get("user")!;
    const body = (await c.req.json()) as { baseNumber?: string };
    try {
      const result = await createBvPerIntervenant(
        c.req.param("missionId"),
        c.req.param("bcId"),
        user.id,
        body.baseNumber ?? "BV",
      );
      return c.json(result);
    } catch (e) {
      return mutationErrorResponse(c, e);
    }
  });
}
