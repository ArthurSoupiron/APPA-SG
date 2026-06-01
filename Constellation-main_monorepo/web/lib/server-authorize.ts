import { headers } from "next/headers";
import { redirect } from "next/navigation";

function backendBase(): string {
  return process.env.AUTH_BACKEND_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";
}

type AssertAccessOptions = {
  anyOf: readonly string[];
  redirectUnauthorized?: string;
  redirectForbidden?: string;
};

/**
 * Appelle `POST /api/app/authorize` sur le backend avec les cookies de la requête Next.
 * À exécuter dans un Server Component **avant** `next/dynamic` pour ne pas envoyer de bundle client métier.
 */
export async function assertBackendAccess({
  anyOf,
  redirectUnauthorized = "/",
  redirectForbidden = "/account/settings",
}: AssertAccessOptions): Promise<void> {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${backendBase()}/api/app/authorize`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ mode: "any", permissions: [...anyOf] }),
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect(redirectUnauthorized);
  }
  if (!res.ok) {
    redirect(redirectForbidden);
  }
}
