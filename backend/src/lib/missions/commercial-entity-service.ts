import type {
  CreateCommercialClientInput,
  CreateCommercialEntrepriseInput,
} from "../../types/missions";
import {
  createCommercialClient,
  createCommercialEntreprise,
} from "./repositories/commercial";

export async function createCommercialClientEntity(
  input: CreateCommercialClientInput,
): Promise<{ id: string; label: string }> {
  const nom = input.nomClient.trim();
  if (!nom) throw new Error("Nom client requis.");
  const id = crypto.randomUUID();
  const now = new Date();
  const row = await createCommercialClient({
    id,
    nomClient: nom,
    prenomClient: input.prenomClient?.trim() ?? "",
    telephoneClient: input.telephoneClient?.trim() ?? "",
    mailClient: input.mailClient?.trim() ?? "",
    prospectId: null,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: row.id,
    label: `${row.nomClient} ${row.prenomClient}`.trim(),
  };
}

export async function createCommercialEntrepriseEntity(
  input: CreateCommercialEntrepriseInput,
): Promise<{ id: string; label: string }> {
  const nom = input.nomEntreprise.trim();
  if (!nom) throw new Error("Nom entreprise requis.");
  const id = crypto.randomUUID();
  const now = new Date();
  const row = await createCommercialEntreprise({
    id,
    nomEntreprise: nom,
    telephoneEntreprise: input.telephoneEntreprise?.trim() ?? "",
    mailEntreprise: input.mailEntreprise?.trim() ?? "",
    adresseEntreprise: input.adresseEntreprise?.trim() ?? "",
    villeEntreprise: input.villeEntreprise?.trim() ?? "",
    codePostalEntreprise: input.codePostalEntreprise?.trim() ?? "",
    paysEntreprise: input.paysEntreprise?.trim() || "France",
    sirenEntreprise: input.sirenEntreprise?.trim() || null,
    prospectId: null,
    createdAt: now,
    updatedAt: now,
  });
  return { id: row.id, label: row.nomEntreprise };
}
