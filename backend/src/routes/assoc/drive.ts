import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import {
  checkAssocFolderAccess,
  downloadAssocDriveFileText,
  getAssocFolderConfig,
  listAssocDriveFiles,
  uploadAssocDocument,
} from "../../lib/assoc/assoc-drive";
import { parseUploadFilesFromFormData } from "../../lib/multipart-files";
import type { AppVariables } from "../../types/app";
import { denyUnlessAuthenticated } from "./helpers";

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Intégration Google Drive de la GED associative. */
export function registerAssocDriveRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  // Téléverse un fichier dans le dossier Drive SG et renvoie ses métadonnées.
  router.post("/documents/upload", async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "unauthorized" }, 401);

    const contentType = c.req.header("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return c.json({ error: "bad_request", message: "multipart/form-data attendu" }, 400);
    }
    const formData = await c.req.formData();
    const files = await parseUploadFilesFromFormData(formData, "files");
    const file = files[0];
    if (!file) return c.json({ error: "bad_request", message: "aucun fichier" }, 400);

    const up = await uploadAssocDocument(user.id, file);
    if (!up.ok) return c.json({ error: "drive_upload_failed", message: up.message }, 502);

    return c.json(
      {
        success: true,
        driveFileId: up.driveFileId,
        name: up.name,
        mimeType: up.mimeType,
        webViewLink: up.webViewLink,
        size: humanSize(file.buffer.length),
      },
      201,
    );
  });

  // État de la config Drive (ID du dossier + test d'accès) — pour la page Paramètres.
  router.get("/drive/status", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    const user = c.get("user");
    if (!user) return c.json({ error: "unauthorized" }, 401);

    const config = getAssocFolderConfig();
    if (!config.folderId) {
      return c.json({ configured: false, folderId: null, source: config.source, accessible: false });
    }
    const access = await checkAssocFolderAccess(user.id);
    return c.json({
      configured: true,
      folderId: config.folderId,
      source: config.source,
      accessible: access.ok,
      folderName: access.ok ? access.name : null,
      webViewLink: access.ok ? access.webViewLink : null,
      message: access.ok ? null : access.message,
    });
  });

  // Liste les fichiers du dossier Drive SG (pour l'import dans la GED).
  router.get("/drive/files", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    const user = c.get("user");
    if (!user) return c.json({ error: "unauthorized" }, 401);

    const res = await listAssocDriveFiles(user.id);
    if (!res.ok) return c.json({ error: "drive_error", message: res.message }, 502);
    return c.json({ files: res.files });
  });

  // Contenu texte d'un fichier Drive (pour importer un CSV de membres depuis Drive).
  router.get("/drive/files/:id/content", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    const user = c.get("user");
    if (!user) return c.json({ error: "unauthorized" }, 401);

    const res = await downloadAssocDriveFileText(user.id, c.req.param("id"));
    if (!res.ok) return c.json({ error: "drive_error", message: res.message }, 502);
    return c.json({ content: res.content });
  });

  app.route("/api/app/assoc", router);
}
