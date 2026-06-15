import type { Hono } from "hono";

import {
  createCommercialClientEntity,
  createCommercialEntrepriseEntity,
} from "../../lib/missions/commercial-entity-service";
import type {
  CreateCommercialClientInput,
  CreateCommercialEntrepriseInput,
} from "../../types/missions";
import type { AppVariables } from "../../types/app";
import { requireBcStructure, requireUser } from "./helpers";

export function registerMissionsCommercialRoutes(app: Hono<{ Variables: AppVariables }>) {
  app.post("/missions/commercial/clients", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireBcStructure(c);
    if (perm) return perm;
    const body = (await c.req.json()) as CreateCommercialClientInput;
    try {
      const created = await createCommercialClientEntity(body);
      return c.json(created, 201);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur création client.";
      return c.json({ error: message }, 422);
    }
  });

  app.post("/missions/commercial/entreprises", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireBcStructure(c);
    if (perm) return perm;
    const body = (await c.req.json()) as CreateCommercialEntrepriseInput;
    try {
      const created = await createCommercialEntrepriseEntity(body);
      return c.json(created, 201);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur création entreprise.";
      return c.json({ error: message }, 422);
    }
  });
}
