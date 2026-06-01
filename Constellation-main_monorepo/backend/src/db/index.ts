import { drizzle } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });

export async function pingDatabase(): Promise<boolean> {
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    client?.release();
  }
}

/** À appeler au démarrage : arrête le process si Postgres n’est pas joignable. */
export async function ensureDatabaseAvailable(): Promise<void> {
  const ok = await pingDatabase();
  if (ok) {
    return;
  }
  console.error("");
  console.error("❌  PostgreSQL est injoignable (connexion refusée ou erreur réseau).");
  console.error(
    "    Vérifie que le serveur Postgres tourne et que DATABASE_URL dans backend/.env est correct.",
  );
  console.error("    Le backend ne démarre pas tant que la base n’est pas disponible.");
  console.error("");
  process.exit(1);
}
