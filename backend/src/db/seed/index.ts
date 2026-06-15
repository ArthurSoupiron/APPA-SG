import { db } from "../index";
import { seedAgenda } from "./agenda";
import { seedNewsletterTags } from "./marketing/newsletter-tags";
import { seedAuthSchema } from "./auth";
import { seedCrmSchema } from "./crm";
import { seedGwSchema } from "./gw";
import { seedMissionsSchema } from "./missions";
import { seedOpsSchema } from "./ops";
import { seedSgSchema } from "./sg";
import { seedSiSchema } from "./si";

/**
 * Applique tous les seeds (ordre respectant les FK).
 */
export async function runAllSeeds(): Promise<void> {
  await seedAuthSchema(db);
  await seedCrmSchema(db);
  await seedSiSchema(db);
  await seedSgSchema(db);
  await seedOpsSchema(db);
  await seedAgenda(db);
  await seedNewsletterTags();
  await seedGwSchema(db);
  await seedMissionsSchema(db);
}

export async function logSeedSummary(): Promise<void> {
  console.log("[seed] OK.");
}
