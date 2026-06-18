/**
 * Remet la base à zéro : schémas applicatifs + journal Drizzle, puis `public` recréé.
 * Enchaînement typique : `bun run db:rebuild` (migrate + seed) ou `db:rebuild:push` si tu utilises surtout `db:push`.
 */
import pg from "pg";
import { getDatabaseUrl } from "./database-url";

/** Schémas métier (voir schema/schemas.ts) + `drizzle` si migrations Drizzle Kit y ont été appliquées. */
const RESET_SQL = `
DROP SCHEMA IF EXISTS auth CASCADE;
DROP SCHEMA IF EXISTS crm CASCADE;
DROP SCHEMA IF EXISTS sg CASCADE;
DROP SCHEMA IF EXISTS assoc CASCADE;
DROP SCHEMA IF EXISTS si CASCADE;
DROP SCHEMA IF EXISTS si_registres CASCADE;
DROP SCHEMA IF EXISTS gw CASCADE;
DROP SCHEMA IF EXISTS ops CASCADE;
DROP SCHEMA IF EXISTS mission CASCADE;
DROP SCHEMA IF EXISTS ubac CASCADE;
DROP SCHEMA IF EXISTS agenda CASCADE;
DROP SCHEMA IF EXISTS marketing CASCADE;
DROP SCHEMA IF EXISTS action_plan CASCADE;
DROP SCHEMA IF EXISTS drizzle CASCADE;
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO CURRENT_USER;
GRANT ALL ON SCHEMA public TO public;
`;

async function main() {
  const client = new pg.Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    await client.query(RESET_SQL);
    console.log(
      "[db:reset] OK — schémas app + drizzle supprimés, public recréé. Puis : bun run db:rebuild (migrate + seed).",
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[db:reset]", err);
  process.exit(1);
});
