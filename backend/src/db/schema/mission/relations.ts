import { relations } from "drizzle-orm";

import { user } from "../auth/user";
import { prospect } from "../crm/prospect";
import { missionBcDesignation, missionBcFrais, missionBonCommande } from "./bon-commande";
import { missionBv } from "./bv";
import { commercialClient } from "./commercial-client";
import { commercialEntreprise } from "./commercial-entreprise";
import { missionCca } from "./cca";
import { missionFa } from "./fa";
import { missionFs } from "./fs";
import { missionDocumentEvent } from "./revisions";
import { missionPvrf } from "./pvrf";
import { missionQs } from "./qs";
import { missionRmi, missionRmiIntervenantAssignation } from "./rmi";

export const commercialClientRelations = relations(commercialClient, ({ one }) => ({
  prospect: one(prospect, { fields: [commercialClient.prospectId], references: [prospect.id] }),
}));

export const commercialEntrepriseRelations = relations(commercialEntreprise, ({ one }) => ({
  prospect: one(prospect, { fields: [commercialEntreprise.prospectId], references: [prospect.id] }),
}));

export const missionCcaRelations = relations(missionCca, ({ one, many }) => ({
  client: one(commercialClient, { fields: [missionCca.clientId], references: [commercialClient.id] }),
  entreprise: one(commercialEntreprise, {
    fields: [missionCca.entrepriseId],
    references: [commercialEntreprise.id],
  }),
  cdp: one(user, { fields: [missionCca.cdpId], references: [user.id] }),
  bonCommandes: many(missionBonCommande),
  events: many(missionDocumentEvent),
}));

export const missionBonCommandeRelations = relations(missionBonCommande, ({ one, many }) => ({
  cca: one(missionCca, { fields: [missionBonCommande.ccaId], references: [missionCca.id] }),
  designations: many(missionBcDesignation),
  frais: many(missionBcFrais),
  fa: many(missionFa),
  fs: many(missionFs),
  rmi: many(missionRmi),
  bv: many(missionBv),
  pvrf: many(missionPvrf),
  qs: many(missionQs),
}));

export const missionRmiRelations = relations(missionRmi, ({ one, many }) => ({
  bc: one(missionBonCommande, { fields: [missionRmi.bcId], references: [missionBonCommande.id] }),
  assignations: many(missionRmiIntervenantAssignation),
}));
