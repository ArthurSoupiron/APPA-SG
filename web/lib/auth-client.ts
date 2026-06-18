import { createAuthClient } from "better-auth/react";

// À défaut de NEXT_PUBLIC_AUTH_URL, on retombe sur l'origine courante
// (les appels passent par le proxy Next sur /api/auth/*, donc même origine).
const baseURL =
  process.env.NEXT_PUBLIC_AUTH_URL ??
  (typeof window !== "undefined" ? window.location.origin : "");

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
    onError(context) {
      const { status } = context.response;
      if (status === 429) {
        const retry = context.response.headers.get("X-Retry-After");
        console.warn("[auth] Rate limit — réessayer après", retry ?? "?", "s");
      }
      if (status === 401) {
        // Better Auth met déjà session à null côté client ; log utile pour debug
        console.info("[auth] Session invalide ou expirée (401)");
      }
    },
  },
  /**
   * Évite qu’une session expirée côté serveur laisse l’UI “connectée” indéfiniment :
   * - refetch au retour sur l’onglet
   * - poll léger tant qu’une session est en cache (secondes)
   */
  sessionOptions: {
    refetchOnWindowFocus: true,
    refetchInterval: 90,
  },
});
