import type { Hono } from "hono";

import {
  generateMissionTemplateDocument,
  getMissionTemplateGenerationFormData,
  listPendingTemplateDocx,
  previewMissionTemplateDocx,
  previewMissionTemplateDryRun,
  syncDriveTemplatesFromDrive,
  validateTemplateDocx,
} from "../../lib/missions/drive-template-service";
import type { TemplateDocType } from "../../types/missions-api";
import type { AppVariables } from "../../types/app";
import {
  requireMissionsRead,
  requireTemplateGenerate,
  requireTemplateSync,
  requireTemplateValidate,
  requireUser,
} from "./helpers";

function parseDocType(raw: string | undefined): TemplateDocType | null {
  const allowed = ["CCA", "BC", "BCR", "RMI", "ARMI", "PVRF"] as const;
  return allowed.includes(raw as TemplateDocType)
    ? (raw as TemplateDocType)
    : null;
}

export function registerMissionsTemplateRoutes(
  app: Hono<{ Variables: AppVariables }>,
) {
  app.get("/missions/:missionId/templates/form-data", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const docType = parseDocType(c.req.query("documentType"));
    if (!docType) return c.json({ error: "documentType invalide" }, 422);
    const user = c.get("user")!;
    try {
      const data = await getMissionTemplateGenerationFormData(
        user.id,
        c.req.param("missionId"),
        c.req.query("bcId") ?? null,
        docType,
      );
      return c.json(data);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Données template indisponibles.";
      return c.json({ error: message }, 422);
    }
  });

  app.post("/missions/:missionId/templates/generate", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const body = await c.req.json();
    const docType = parseDocType(body.documentType);
    if (!docType) return c.json({ error: "documentType invalide" }, 422);
    const perm = requireTemplateGenerate(c, docType);
    if (perm) return perm;
    const user = c.get("user")!;
    try {
      const result = await generateMissionTemplateDocument(
        user.id,
        c.req.param("missionId"),
        {
          bcId: body.bcId ?? null,
          documentType: docType,
          documentNumber: body.documentNumber ?? "001",
          values: body.values ?? {},
        },
      );
      return c.json({ docxUrl: result.docxUrl, pdfUrl: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Échec génération.";
      return c.json({ error: message }, 422);
    }
  });

  app.post("/missions/:missionId/templates/preview", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const body = await c.req.json();
    const docType = parseDocType(body.documentType);
    if (!docType) return c.json({ error: "documentType invalide" }, 422);
    const perm = requireTemplateGenerate(c, docType);
    if (perm) return perm;
    const user = c.get("user")!;
    try {
      const result = await previewMissionTemplateDocx(user.id, {
        missionId: c.req.param("missionId"),
        bcId: body.bcId ?? null,
        documentType: docType,
        values: body.values ?? {},
        perTargetValues: body.perTargetValues,
        targetIntervenantId: body.targetIntervenantId ?? null,
      });
      return c.json(result);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Prévisualisation impossible.";
      return c.json({ error: message }, 422);
    }
  });

  app.post("/missions/:missionId/templates/dry-run", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const body = await c.req.json();
    const docType = parseDocType(body.documentType);
    if (!docType) return c.json({ error: "documentType invalide" }, 422);
    const perm = requireTemplateGenerate(c, docType);
    if (perm) return perm;
    const user = c.get("user")!;
    return c.json(
      await previewMissionTemplateDryRun(user.id, docType, body.values ?? {}),
    );
  });

  app.get("/missions/:missionId/templates/pending-docx", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const docType = parseDocType(c.req.query("documentType"));
    if (!docType) return c.json({ error: "documentType invalide" }, 422);
    const user = c.get("user")!;
    const files = await listPendingTemplateDocx(
      user.id,
      c.req.param("missionId"),
      c.req.query("bcId") ?? null,
      docType,
    );
    return c.json(files);
  });

  app.post("/missions/:missionId/templates/validate", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const body = await c.req.json();
    const docType = parseDocType(body.documentType);
    if (!docType) return c.json({ error: "documentType invalide" }, 422);
    const perm = requireTemplateValidate(c, docType);
    if (perm) return perm;
    const user = c.get("user")!;
    try {
      const result = await validateTemplateDocx(
        user.id,
        c.req.param("missionId"),
        {
          bcId: body.bcId ?? null,
          documentType: docType,
          docxFileId: body.docxFileId ?? body.htmlFileId,
          outputBaseName: body.outputBaseName,
        },
      );
      return c.json({ pdfUrl: result.pdfUrl });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Échec validation.";
      return c.json({ error: message }, 422);
    }
  });

  app.post("/missions/templates/sync", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireTemplateSync(c);
    if (perm) return perm;
    const user = c.get("user")!;
    const result = await syncDriveTemplatesFromDrive(user.id);
    if (!result.ok)
      return c.json({ ok: false, error: result.error, items: [] }, 422);
    return c.json(result);
  });

  app.post("/admin/mission-templates/sync", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireTemplateSync(c);
    if (perm) return perm;
    const user = c.get("user")!;
    const result = await syncDriveTemplatesFromDrive(user.id);
    if (!result.ok)
      return c.json({ ok: false, error: result.error, items: [] }, 422);
    return c.json(result);
  });
}
