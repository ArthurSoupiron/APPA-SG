import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Dossier de l’app Next (`web/`) : évite que Turbopack prenne le monorepo comme racine (plusieurs bun.lock) et ne résolve plus `tailwindcss`. */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const authBackend =
  process.env.AUTH_BACKEND_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";

// In Next.js dev, NODE_ENV might not be explicitly set, so we default to development
const isProd = process.env.NODE_ENV === "production";

function securityHeaderEntries(): { key: string; value: string }[] {
  const headers: { key: string; value: string }[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
  ];

  let connect = "'self'";
  const publicAuth = process.env.NEXT_PUBLIC_AUTH_URL?.trim();
  if (publicAuth?.startsWith("http")) {
    try {
      connect += ` ${new URL(publicAuth).origin}`;
    } catch {
      /* ignore */
    }
  } else if (authBackend.startsWith("http")) {
    try {
      connect += ` ${new URL(authBackend).origin}`;
    } catch {
      /* ignore */
    }
  }

  // Always include 'unsafe-eval' in development to allow React debugging
  const scriptSrc = isProd
    ? "'self' 'unsafe-inline' https://accounts.google.com"
    : "'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com";

  // Log CSP configuration in development for debugging
  if (!isProd) {
    console.log(
      "[CSP] Development mode - unsafe-eval enabled for React debugging",
    );
  }

  const cspParts = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connect} https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (isProd) {
    cspParts.push("upgrade-insecure-requests");
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }
  headers.push({ key: "Content-Security-Policy", value: cspParts.join("; ") });

  return headers;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaderEntries(),
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/crm",
        destination: "/myster/dashboard",
        permanent: true,
      },
      {
        source: "/crm/:path*",
        destination: "/myster/:path*",
        permanent: true,
      },
      {
        source: "/si",
        has: [{ type: "query", key: "tab", value: "manage" }],
        destination: "/si",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${authBackend}/api/auth/:path*`,
      },
      { source: "/session", destination: `${authBackend}/session` },
      {
        source: "/api/app/:path*",
        destination: `${authBackend}/api/app/:path*`,
      },
      {
        source: "/api/public/:path*",
        destination: `${authBackend}/api/public/:path*`,
      },
    ];
  },
};

export default nextConfig;
