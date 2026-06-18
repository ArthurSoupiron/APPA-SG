import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { isMarketingIntegrationConfigured } from "../../lib/marketing/marketing-env";
import { sendSmtpMail } from "../../lib/marketing/smtp-send";
import type { AppVariables } from "../../types/app";
import { asString, denyUnlessAuthenticated, readJsonBody } from "./helpers";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Relance de dossier membre par email (module SG).
 * Réutilise le SMTP déjà configuré côté backend (cf. SMTP_* dans .env).
 * Renvoie 503 { configured: false } si le SMTP n'est pas configuré → le front
 * bascule alors sur un brouillon mailto.
 */
export function registerAssocRelanceRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post("/relance", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;

    const body = await readJsonBody(c);
    if (!body) return c.json({ error: "bad_request" }, 400);

    const to = asString(body.to);
    const subject = asString(body.subject);
    const text = asString(body.body);
    if (!to || !subject || !text) return c.json({ error: "missing_fields" }, 400);

    if (!isMarketingIntegrationConfigured("smtp")) {
      return c.json({ configured: false }, 503);
    }

    const html = `<pre style="font-family:inherit;white-space:pre-wrap;margin:0">${escapeHtml(text)}</pre>`;
    const res = await sendSmtpMail({ to, subject, html });
    if (res.ok) return c.json({ sent: true });
    return c.json({ error: res.error }, 502);
  });

  app.route("/api/app/assoc", router);
}
