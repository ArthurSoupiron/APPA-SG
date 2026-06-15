import { relations } from "drizzle-orm";

import { user } from "../auth/user";

import { registreBdd } from "./registre-bdd";
import { registreLicences } from "./registre-licences";
import { registreRgpd } from "./registre-rgpd";
import { traitementData } from "./traitement-data";

export const traitementDataRelations = relations(traitementData, ({ one, many }) => ({
  user: one(user, { fields: [traitementData.userId], references: [user.id] }),
  registresBdd: many(registreBdd),
}));

export const registreRgpdRelations = relations(registreRgpd, ({ one }) => ({
  user: one(user, { fields: [registreRgpd.userId], references: [user.id] }),
}));

export const registreLicencesRelations = relations(registreLicences, ({ one }) => ({
  user: one(user, { fields: [registreLicences.userId], references: [user.id] }),
}));

export const registreBddRelations = relations(registreBdd, ({ one }) => ({
  user: one(user, { fields: [registreBdd.userId], references: [user.id] }),
  traitementData: one(traitementData, {
    fields: [registreBdd.traitementDataId],
    references: [traitementData.id],
  }),
}));
