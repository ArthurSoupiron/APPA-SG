import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { getMarketingEnv, isMarketingIntegrationConfigured } from "../../lib/marketing/marketing-env";
import type { AppVariables } from "../../types/app";
import { asString, denyUnlessAuthenticated, readJsonBody } from "./helpers";

/**
 * Relance de dossier membre par email (module SG).
 * Envoi réel via nodemailer (STARTTLS/SMTPS géré proprement), en réutilisant
 * la config SMTP_* du backend. Renvoie 503 { configured: false } si le SMTP
 * n'est pas configuré → le front bascule alors sur un brouillon mailto.
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

    const { smtp } = getMarketingEnv();
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transport = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465, // 465 = TLS implicite ; 587 = STARTTLS (auto)
        auth: { user: smtp.user, pass: smtp.pass },
      });
      const from = smtp.fromName ? `"${smtp.fromName}" <${smtp.from}>` : smtp.from;
      const info = await transport.sendMail({ from, to, subject, text });
      return c.json({ sent: true, messageId: info.messageId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Envoi impossible";
      return c.json({ error: message }, 502);
    }
  });

  app.route("/api/app/assoc", router);
}
