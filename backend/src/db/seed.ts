/**
 * Point d’entrée CLI — données éditables dans `src/db/seed/<schéma>/<table>.ts`.
 */
import { logSeedSummary, runAllSeeds } from "./seed/index";

async function main() {
  await runAllSeeds();
  await logSeedSummary();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed] Erreur :", err);
    process.exit(1);
  });
