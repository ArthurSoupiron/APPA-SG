import type { SeedDb } from "../db-type";
import { seedAgendaEventTypes } from "./event-type";

export async function seedAgenda(db: SeedDb) {
  await seedAgendaEventTypes(db);
}
