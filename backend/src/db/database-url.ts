/**
 * Même logique que drizzle.config — Bun ne développe pas toujours ${VAR} dans DATABASE_URL.
 */
export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (raw && !raw.includes("${")) {
    return raw;
  }
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const port = process.env.POSTGRES_PORT ?? "5432";
  const db = process.env.POSTGRES_DB;
  if (user && password && db) {
    return `postgresql://${user}:${encodeURIComponent(password)}@localhost:${port}/${db}`;
  }
  throw new Error("DATABASE_URL ou POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB requis");
}
