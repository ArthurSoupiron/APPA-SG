import { NextResponse } from "next/server";

// Force le runtime Node (nodemailer n'est pas compatible Edge).
export const runtime = "nodejs";

type RelancePayload = { to?: string; subject?: string; body?: string };

/**
 * Envoi automatique des relances de dossier (module SG).
 * Configuré via variables d'environnement SMTP_*. Si le SMTP n'est pas
 * configuré, renvoie 503 { configured: false } → le client bascule alors
 * sur l'ouverture d'un brouillon mailto (repli).
 */
export async function POST(request: Request) {
  let payload: RelancePayload;
  try {
    payload = (await request.json()) as RelancePayload;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { to, subject, body } = payload;
  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Champs requis manquants (to, subject, body)" }, { status: 400 });
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;
  if (!host || !user || !pass) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }

  try {
    const nodemailer = (await import("nodemailer")).default;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = SMTPS implicite, sinon STARTTLS
      auth: { user, pass },
    });
    await transport.sendMail({ from, to, subject, text: body });
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "Envoi impossible" }, { status: 502 });
  }
}
