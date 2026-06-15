import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { isRegistresDriveConfigured } from "../../../lib/si-registres/drive";
import { scanRegistresDrive } from "../../../lib/si-registres/drive-scan-service";
import {
  createRegistreBdd,
  createRegistreLicences,
  createRegistreRgpd,
  deleteRegistre,
  getAllRegistres,
  searchRegistres,
  updateRegistre,
} from "../../../lib/si-registres/registres-service";
import {
  extractDriveFileIdFromUrl,
  listSheetPermissions,
} from "../../../lib/si-registres/sheet-permissions-service";
import { getTraitementDataTemplateUrl } from "../../../lib/si-registres/traitement-data-constants";
import {
  createTraitementData,
  deleteTraitementData,
  depositTraitementTemplate,
  getAllTraitementData,
  scanTraitementDrivePreuves,
  updateTraitementData,
  uploadTraitementPdf,
  uploadTraitementPreuve,
} from "../../../lib/si-registres/traitement-data-service";
import type { RegistreType } from "../../../lib/si-registres/types";
import { parseUploadFilesFromFormData } from "../../../lib/multipart-files";
import type { AppVariables } from "../../../types/app";
import {
  denyUnlessAuthenticated,
  denyUnlessDelete,
  denyUnlessMutate,
  denyUnlessView,
  readJsonBody,
} from "./helpers";

export function registerSiRegistresRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get("/initial", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessView(c);
    if (denied) return denied;

    const [registres, traitements] = await Promise.all([
      getAllRegistres(),
      getAllTraitementData(),
    ]);

    return c.json({
      registres,
      traitements,
      driveConfigured: isRegistresDriveConfigured(),
      traitementDataTemplateUrl: getTraitementDataTemplateUrl(),
    });
  });

  router.get("/search", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessView(c);
    if (denied) return denied;
    const q = c.req.query("q") ?? "";
    const type = c.req.query("type") as RegistreType | undefined;
    const registres = await searchRegistres(q, type);
    return c.json({ registres });
  });

  router.post("/rgpd", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const body = await readJsonBody(c);
    if (!body || typeof body.anneeCivile !== "number" || typeof body.nom !== "string") {
      return c.json({ error: "invalid_body" }, 400);
    }
    const result = await createRegistreRgpd(user.id, {
      anneeCivile: body.anneeCivile,
      nom: body.nom.trim(),
    });
    if ("error" in result) return c.json({ error: result.error }, 400);
    return c.json({ registre: result }, 201);
  });

  router.patch("/rgpd/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "invalid_body" }, 400);
    const registre = await updateRegistre(c.req.param("id"), "rgpd", body);
    if (!registre) return c.json({ error: "not_found" }, 404);
    return c.json({ registre });
  });

  router.delete("/rgpd/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessDelete(c);
    if (denied) return denied;
    const ok = await deleteRegistre(c.req.param("id"), "rgpd");
    if (!ok) return c.json({ error: "not_found" }, 404);
    return c.json({ success: true });
  });

  router.post("/licences", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const body = await readJsonBody(c);
    if (!body || typeof body.anneeCivile !== "number" || typeof body.nom !== "string") {
      return c.json({ error: "invalid_body" }, 400);
    }
    const result = await createRegistreLicences(user.id, {
      anneeCivile: body.anneeCivile,
      nom: body.nom.trim(),
      dateFacturation:
        typeof body.dateFacturation === "string" ? new Date(body.dateFacturation) : null,
      utilisationCommerciale: Boolean(body.utilisationCommerciale),
      licenceCommercialeUrl:
        typeof body.licenceCommercialeUrl === "string" ? body.licenceCommercialeUrl : null,
    });
    if ("error" in result) return c.json({ error: result.error }, 400);
    return c.json({ registre: result }, 201);
  });

  router.patch("/licences/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "invalid_body" }, 400);
    const registre = await updateRegistre(c.req.param("id"), "licences", body);
    if (!registre) return c.json({ error: "not_found" }, 404);
    return c.json({ registre });
  });

  router.delete("/licences/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessDelete(c);
    if (denied) return denied;
    const ok = await deleteRegistre(c.req.param("id"), "licences");
    if (!ok) return c.json({ error: "not_found" }, 404);
    return c.json({ success: true });
  });

  router.post("/bdd", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const body = await readJsonBody(c);
    if (!body || typeof body.anneeCivile !== "number" || typeof body.nom !== "string") {
      return c.json({ error: "invalid_body" }, 400);
    }
    const result = await createRegistreBdd(user.id, {
      anneeCivile: body.anneeCivile,
      nom: body.nom.trim(),
      traitementDataId:
        typeof body.traitementDataId === "string" ? body.traitementDataId : null,
      sheetExcelUrl: typeof body.sheetExcelUrl === "string" ? body.sheetExcelUrl : null,
    });
    if ("error" in result) return c.json({ error: result.error }, 400);
    return c.json({ registre: result }, 201);
  });

  router.patch("/bdd/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "invalid_body" }, 400);
    const registre = await updateRegistre(c.req.param("id"), "bdd", body);
    if (!registre) return c.json({ error: "not_found" }, 404);
    return c.json({ registre });
  });

  router.delete("/bdd/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessDelete(c);
    if (denied) return denied;
    const ok = await deleteRegistre(c.req.param("id"), "bdd");
    if (!ok) return c.json({ error: "not_found" }, 404);
    return c.json({ success: true });
  });

  router.post("/traitements", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const body = await readJsonBody(c);
    if (!body || typeof body.nomTraitement !== "string") {
      return c.json({ error: "invalid_body" }, 400);
    }
    const result = await createTraitementData(user.id, {
      nomTraitement: body.nomTraitement.trim(),
      descriptionFinalite:
        typeof body.descriptionFinalite === "string" ? body.descriptionFinalite : null,
    });
    if ("error" in result) return c.json({ error: result.error }, 400);
    return c.json({ traitement: result }, 201);
  });

  router.patch("/traitements/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "invalid_body" }, 400);
    const traitement = await updateTraitementData(c.req.param("id"), body);
    if (!traitement) return c.json({ error: "not_found" }, 404);
    return c.json({ traitement });
  });

  router.delete("/traitements/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessDelete(c);
    if (denied) return denied;
    const ok = await deleteTraitementData(c.req.param("id"));
    if (!ok) return c.json({ error: "not_found" }, 404);
    return c.json({ success: true });
  });

  router.post("/traitements/:id/preuves/upload", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const type = c.req.query("type");
    if (type !== "consentement" && type !== "mentions") {
      return c.json({ error: "invalid_type" }, 400);
    }
    const form = await c.req.formData().catch(() => null);
    if (!form) return c.json({ error: "invalid_form" }, 400);
    const files = await parseUploadFilesFromFormData(form);
    const file = files[0];
    if (!file) return c.json({ error: "no_file" }, 400);
    const result = await uploadTraitementPreuve(user.id, c.req.param("id"), type, file);
    if ("error" in result) return c.json({ error: result.error }, 400);
    return c.json({ traitement: result });
  });

  router.post("/traitements/:id/scan-preuves", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const result = await scanTraitementDrivePreuves(user.id, c.req.param("id"));
    if ("error" in result) return c.json({ error: result.error }, 400);
    return c.json({ traitement: result });
  });

  router.post("/traitements/:id/deposit-template", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const result = await depositTraitementTemplate(user.id, c.req.param("id"));
    if ("error" in result) {
      return c.json(
        { error: result.error, templateSourceUrl: result.templateSourceUrl },
        400,
      );
    }
    return c.json(result);
  });

  router.post("/traitements/:id/pdf", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const form = await c.req.formData().catch(() => null);
    if (!form) return c.json({ error: "invalid_form" }, 400);
    const files = await parseUploadFilesFromFormData(form);
    const file = files[0];
    if (!file) return c.json({ error: "no_file" }, 400);
    const result = await uploadTraitementPdf(user.id, c.req.param("id"), file);
    if ("error" in result) return c.json({ error: result.error }, 400);
    return c.json({ traitement: result });
  });

  router.get("/sheets/permissions", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessView(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const url = c.req.query("url") ?? "";
    const fileId = extractDriveFileIdFromUrl(url);
    if (!fileId) return c.json({ error: "invalid_url" }, 400);
    const result = await listSheetPermissions(user.id, fileId);
    if (!result.ok) return c.json({ error: result.message }, 400);
    return c.json({ permissions: result.permissions });
  });

  router.post("/drive/scan", async (c) => {
    const denied = denyUnlessAuthenticated(c) ?? denyUnlessMutate(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const body = await readJsonBody(c);
    const rootFolderId =
      body && typeof body.rootFolderId === "string" ? body.rootFolderId : undefined;
    const result = await scanRegistresDrive(user.id, rootFolderId);
    if ("error" in result) return c.json({ error: result.error }, 400);
    return c.json(result);
  });

  app.route("/api/app/si/registres", router);
}
