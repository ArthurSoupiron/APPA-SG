import { createAuthClient } from "better-auth/react";

const baseURL = process.env.NEXT_PUBLIC_AUTH_URL;

if (!baseURL && typeof window !== "undefined") {
  console.warn("NEXT_PUBLIC_AUTH_URL n'est pas défini");
}

export const authClient = createAuthClient({
  baseURL: baseURL ?? "",
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
