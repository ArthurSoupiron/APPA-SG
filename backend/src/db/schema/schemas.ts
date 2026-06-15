import { pgSchema } from "drizzle-orm/pg-core";

/** Better Auth : user, session, account, verification */
export const authSchema = pgSchema("auth");

/** Rôles & permissions applicatives (UBAC) */
/** CRM : prospection, sprints */
export const crmSchema = pgSchema("crm");

/** Slack — nom court demandé pour l’explorateur SQL */
export const sgSchema = pgSchema("sg");

/**
 * Intégrations externes (ex. Google Drive).
 * Les comptes OAuth Google restent dans `auth.account`.
 */
export const siSchema = pgSchema("si");

/** Cache annuaire Google Workspace (groupes, membres) + pont UBAC */
export const gwSchema = pgSchema("gw");

/** Gestion Associative (SG) — membres, mandats, documents (GED), échéances, conformité */
export const assocSchema = pgSchema("assoc");

/** Jobs async, annonces globales (bandeau) */
export const opsSchema = pgSchema("ops");

/** Agenda organisationnel — événements multi-pôles */
export const agendaSchema = pgSchema("agenda");

/** Marketing : LinkedIn, YouTube, newsletter, Webflow */
export const marketingSchema = pgSchema("marketing");

/** Plan d'action organisationnel — hiérarchie axe → sous-action */
export const actionPlanSchema = pgSchema("action_plan");

/** Registres & conformité S.I. — licences, RGPD, BDD, traitements de données */
export const siRegistresSchema = pgSchema("si_registres");

/** Gestionnaire de missions — CCA, BC, workflow documentaire */
export const missionSchema = pgSchema("mission");
