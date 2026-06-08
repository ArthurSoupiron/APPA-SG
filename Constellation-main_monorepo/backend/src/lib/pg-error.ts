/** Détecte une panne de connexion Postgres (souvent ECONNREFUSED si le serveur est arrêté). */
export function isPostgresUnavailable(err: unknown): boolean {
  let current: unknown = err;
  const seen = new Set<unknown>();
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    const code = (current as NodeJS.ErrnoException).code;
    if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
      return true;
    }
    if (current.message.includes("ECONNREFUSED")) {
      return true;
    }
    current = current.cause;
  }
  return false;
}
