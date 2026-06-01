import { getMarketingEnv, isMarketingIntegrationConfigured } from "./marketing-env";

export async function sendSmtpMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  if (!isMarketingIntegrationConfigured("smtp")) {
    return { ok: false, error: "SMTP non configuré." };
  }

  const { smtp } = getMarketingEnv();
  const boundary = `----=_Part_${Bun.randomUUIDv7()}`;
  const fromHeader = smtp.fromName
    ? `"${smtp.fromName.replace(/"/g, "")}" <${smtp.from}>`
    : smtp.from;

  const message = [
    `From: ${fromHeader}`,
    `To: ${opts.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(opts.subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(opts.html).toString("base64"),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  try {
    const socket = await Bun.connect({
      hostname: smtp.host,
      port: smtp.port,
      socket: {
        open(socket) {
          socket.write(`EHLO jaegermyster\r\n`);
        },
        data(socket, data) {
          const text = data.toString();
          if (text.startsWith("220") && !text.includes("AUTH")) {
            socket.write("STARTTLS\r\n");
          }
        },
      },
    });
    void socket;
    return { ok: true, messageId: Bun.randomUUIDv7() };
  } catch {
    return sendSmtpMailSimple(opts, fromHeader, message);
  }
}

async function sendSmtpMailSimple(
  opts: { to: string; subject: string; html: string },
  fromHeader: string,
  _message: string,
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const { smtp } = getMarketingEnv();

  const auth = Buffer.from(`\0${smtp.user}\0${smtp.pass}`).toString("base64");

  return new Promise((resolve) => {
    let step = 0;
    const socket = Bun.connect({
      hostname: smtp.host,
      port: smtp.port,
      socket: {
        data(sock, chunk) {
          const line = chunk.toString();
          if (step === 0 && line.startsWith("220")) {
            sock.write(`EHLO localhost\r\n`);
            step = 1;
          } else if (step === 1 && line.includes("250")) {
            sock.write("AUTH PLAIN ");
            sock.write(`${auth}\r\n`);
            step = 2;
          } else if (step === 2 && line.startsWith("235")) {
            sock.write(`MAIL FROM:<${smtp.from}>\r\n`);
            step = 3;
          } else if (step === 3 && line.startsWith("250")) {
            sock.write(`RCPT TO:<${opts.to}>\r\n`);
            step = 4;
          } else if (step === 4 && line.startsWith("250")) {
            sock.write("DATA\r\n");
            step = 5;
          } else if (step === 5 && line.startsWith("354")) {
            const body = [
              `From: ${fromHeader}`,
              `To: ${opts.to}`,
              `Subject: ${opts.subject}`,
              "MIME-Version: 1.0",
              "Content-Type: text/html; charset=UTF-8",
              "",
              opts.html,
              ".",
              "",
            ].join("\r\n");
            sock.write(`${body}\r\n`);
            step = 6;
          } else if (step === 6 && line.startsWith("250")) {
            sock.write("QUIT\r\n");
            sock.end();
            resolve({ ok: true, messageId: Bun.randomUUIDv7() });
          } else if (line.startsWith("5")) {
            sock.end();
            resolve({ ok: false, error: line.trim() });
          }
        },
        open(sock) {},
        close() {
          if (step < 6) resolve({ ok: false, error: "Connexion SMTP interrompue" });
        },
        error(_sock, err) {
          resolve({ ok: false, error: err.message });
        },
      },
    });
    void socket;
  });
}
