import { google } from "googleapis";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { getDriveAuthForUser } from "../../lib/google-drive-user-auth";
import type { AppVariables } from "../../types/app";
import { escapeDriveNameContains, resolveDriveItemPath } from "./drive-search-helpers";

const MAX_PERMISSIONS = 80;

function denyUnlessAuthenticated(c: {
  get: (k: "user") => AppVariables["user"];
  json: (b: unknown, s: number) => Response;
}): Response | null {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  return null;
}

function googleErrorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  return String(e);
}

export function registerDriveRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const driveRouter = new Hono<{ Variables: AppVariables }>();

  driveRouter.get("/shared-drives", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    const user = c.get("user")!;

    const authRes = await getDriveAuthForUser(user.id);
    if (!authRes.ok) return c.json({ error: "drive_auth", message: authRes.message }, 403);

    const pageToken = c.req.query("pageToken") ?? undefined;
    const api = google.drive({ version: "v3", auth: authRes.auth });

    try {
      const res = await api.drives.list({
        pageSize: 100,
        pageToken,
        fields: "nextPageToken, drives(id, name)",
      });
      return c.json({
        drives: (res.data.drives ?? []).map((d) => ({
          id: d.id ?? "",
          name: d.name ?? "—",
        })),
        nextPageToken: res.data.nextPageToken ?? null,
      });
    } catch (e) {
      return c.json({ error: "drive_api", message: googleErrorMessage(e) }, 502);
    }
  });

  driveRouter.get("/children", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    const user = c.get("user")!;

    const driveId = c.req.query("driveId")?.trim();
    const parentId = c.req.query("parentId")?.trim();
    if (!driveId || !parentId) {
      return c.json({ error: "bad_request", message: "driveId et parentId sont requis." }, 400);
    }

    const authRes = await getDriveAuthForUser(user.id);
    if (!authRes.ok) return c.json({ error: "drive_auth", message: authRes.message }, 403);

    const pageToken = c.req.query("pageToken") ?? undefined;
    const api = google.drive({ version: "v3", auth: authRes.auth });

    const q = `'${parentId}' in parents and trashed = false`;

    try {
      const res = await api.files.list({
        corpora: "drive",
        driveId,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        q,
        pageSize: 100,
        pageToken,
        fields:
          "nextPageToken, files(id, name, mimeType, webViewLink, shortcutDetails(targetId, targetMimeType))",
      });
      const files = (res.data.files ?? []).map((f) => ({
        id: f.id ?? "",
        name: f.name ?? "—",
        mimeType: f.mimeType ?? "",
        webViewLink: f.webViewLink ?? null,
        shortcutDetails: f.shortcutDetails
          ? {
              targetId: f.shortcutDetails.targetId ?? null,
              targetMimeType: f.shortcutDetails.targetMimeType ?? null,
            }
          : null,
      }));
      return c.json({
        files,
        nextPageToken: res.data.nextPageToken ?? null,
      });
    } catch (e) {
      return c.json({ error: "drive_api", message: googleErrorMessage(e) }, 502);
    }
  });

  driveRouter.get("/permissions", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    const user = c.get("user")!;

    const fileId = c.req.query("fileId")?.trim();
    const driveId = c.req.query("driveId")?.trim();
    if (!fileId || !driveId) {
      return c.json({ error: "bad_request", message: "fileId et driveId sont requis." }, 400);
    }

    const authRes = await getDriveAuthForUser(user.id);
    if (!authRes.ok) return c.json({ error: "drive_auth", message: authRes.message }, 403);

    const api = google.drive({ version: "v3", auth: authRes.auth });

    try {
      const res = await api.permissions.list({
        fileId,
        supportsAllDrives: true,
        fields: "permissions(id,type,emailAddress,displayName,role,domain)",
        pageSize: MAX_PERMISSIONS,
      });

      const permissions = (res.data.permissions ?? []).slice(0, MAX_PERMISSIONS).map((p) => ({
        id: p.id ?? "",
        type: p.type ?? "",
        emailAddress: p.emailAddress ?? null,
        displayName: p.displayName ?? null,
        role: p.role ?? null,
        domain: p.domain ?? null,
      }));

      return c.json({ permissions });
    } catch (e) {
      return c.json({ error: "drive_api", message: googleErrorMessage(e) }, 502);
    }
  });

  driveRouter.get("/search", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    const user = c.get("user")!;

    const raw = c.req.query("q")?.trim() ?? "";
    if (raw.length < 2) return c.json({ results: [] });
    if (raw.length > 200) {
      return c.json({ error: "bad_request", message: "Requête trop longue." }, 400);
    }

    const authRes = await getDriveAuthForUser(user.id);
    if (!authRes.ok) return c.json({ error: "drive_auth", message: authRes.message }, 403);

    const api = google.drive({ version: "v3", auth: authRes.auth });
    const term = escapeDriveNameContains(raw);
    const q = `name contains '${term}' and trashed = false`;

    try {
      const res = await api.files.list({
        corpora: "allDrives",
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        q,
        pageSize: 25,
        fields: "files(id,name,mimeType,driveId,parents,webViewLink)",
      });
      const files = (res.data.files ?? [])
        .filter((f): f is typeof f & { id: string; driveId: string } => Boolean(f.id && f.driveId))
        .slice(0, 15);

      const driveNameCache = new Map<string, string>();
      const getDriveName = async (driveId: string): Promise<string> => {
        if (driveNameCache.has(driveId)) return driveNameCache.get(driveId)!;
        try {
          const d = await api.drives.get({ driveId, fields: "name" });
          const n = d.data.name ?? driveId;
          driveNameCache.set(driveId, n);
          return n;
        } catch {
          driveNameCache.set(driveId, driveId);
          return driveId;
        }
      };

      const results = await Promise.all(
        files.map(async (f) => {
          const driveId = f.driveId as string;
          const id = f.id as string;
          const driveName = await getDriveName(driveId);
          const path = await resolveDriveItemPath(api, driveId, driveName, id);
          return {
            id,
            name: f.name ?? "—",
            mimeType: f.mimeType ?? "",
            driveId,
            webViewLink: f.webViewLink ?? null,
            pathHint: path.pathHint,
            folderIdsFromRoot: path.folderIdsFromRoot,
          };
        }),
      );

      return c.json({ results });
    } catch (e) {
      return c.json({ error: "drive_api", message: googleErrorMessage(e) }, 502);
    }
  });

  app.route("/api/app/drive", driveRouter);
}
