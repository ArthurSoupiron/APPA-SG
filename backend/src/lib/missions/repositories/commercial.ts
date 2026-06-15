import { asc, eq } from "drizzle-orm";

import { db } from "../../../db";
import { commercialClient, commercialEntreprise } from "../../../db/schema";
import type {
  CommercialClient,
  CommercialClientInsert,
  CommercialEntreprise,
  CommercialEntrepriseInsert,
} from "../../../types/missions";

export async function getCommercialClientById(
  id: string,
): Promise<CommercialClient | undefined> {
  const [row] = await db.select().from(commercialClient).where(eq(commercialClient.id, id));
  return row;
}

export async function listCommercialClients(): Promise<CommercialClient[]> {
  return db.select().from(commercialClient).orderBy(asc(commercialClient.nomClient));
}

export async function findCommercialClientByProspectId(
  prospectId: string,
): Promise<CommercialClient | undefined> {
  const [row] = await db
    .select()
    .from(commercialClient)
    .where(eq(commercialClient.prospectId, prospectId))
    .limit(1);
  return row;
}

export async function createCommercialClient(
  values: CommercialClientInsert,
): Promise<CommercialClient> {
  const result = await db.insert(commercialClient).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer le client commercial.");
  }
  return row;
}

export async function updateCommercialClient(
  id: string,
  values: Partial<CommercialClientInsert>,
): Promise<CommercialClient | undefined> {
  const result = await db
    .update(commercialClient)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(commercialClient.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}

export async function getCommercialEntrepriseById(
  id: string,
): Promise<CommercialEntreprise | undefined> {
  const [row] = await db
    .select()
    .from(commercialEntreprise)
    .where(eq(commercialEntreprise.id, id));
  return row;
}

export async function listCommercialEntreprises(): Promise<CommercialEntreprise[]> {
  return db
    .select()
    .from(commercialEntreprise)
    .orderBy(asc(commercialEntreprise.nomEntreprise));
}

export async function findCommercialEntrepriseByProspectId(
  prospectId: string,
): Promise<CommercialEntreprise | undefined> {
  const [row] = await db
    .select()
    .from(commercialEntreprise)
    .where(eq(commercialEntreprise.prospectId, prospectId))
    .limit(1);
  return row;
}

export async function findCommercialEntrepriseByName(
  nomEntreprise: string,
): Promise<CommercialEntreprise | undefined> {
  const [row] = await db
    .select()
    .from(commercialEntreprise)
    .where(eq(commercialEntreprise.nomEntreprise, nomEntreprise))
    .limit(1);
  return row;
}

export async function createCommercialEntreprise(
  values: CommercialEntrepriseInsert,
): Promise<CommercialEntreprise> {
  const result = await db.insert(commercialEntreprise).values(values).returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  if (!row) {
    throw new Error("Impossible de creer l'entreprise commerciale.");
  }
  return row;
}

export async function updateCommercialEntreprise(
  id: string,
  values: Partial<CommercialEntrepriseInsert>,
): Promise<CommercialEntreprise | undefined> {
  const result = await db
    .update(commercialEntreprise)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(commercialEntreprise.id, id))
    .returning();
  const row = Array.isArray(result) ? result[0] : undefined;
  return row;
}
