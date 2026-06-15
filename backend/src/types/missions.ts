import type {
  BonCommandeType,
  MissionDocumentEventType,
  RevisionChangeType,
  RMIType,
} from "../db/schema/mission/enums";
import type {
  commercialClient,
  commercialEntreprise,
  missionBonCommande,
  missionBcDesignation,
  missionBcFrais,
  missionBv,
  missionCca,
  missionDocumentEvent,
  missionFa,
  missionFs,
  missionPvrf,
  missionQs,
  missionRmi,
} from "../db/schema/mission";

export type { BonCommandeType, MissionDocumentEventType, RevisionChangeType, RMIType };

export type MissionCca = typeof missionCca.$inferSelect;
export type MissionCcaInsert = typeof missionCca.$inferInsert;
export type MissionBonCommande = typeof missionBonCommande.$inferSelect;
export type MissionBonCommandeInsert = typeof missionBonCommande.$inferInsert;
export type MissionBcDesignation = typeof missionBcDesignation.$inferSelect;
export type MissionBcDesignationInsert = typeof missionBcDesignation.$inferInsert;
export type MissionBcFrais = typeof missionBcFrais.$inferSelect;
export type MissionBcFraisInsert = typeof missionBcFrais.$inferInsert;
export type MissionFa = typeof missionFa.$inferSelect;
export type MissionFaInsert = typeof missionFa.$inferInsert;
export type MissionFs = typeof missionFs.$inferSelect;
export type MissionFsInsert = typeof missionFs.$inferInsert;
export type MissionRmi = typeof missionRmi.$inferSelect;
export type MissionRmiInsert = typeof missionRmi.$inferInsert;
export type MissionBv = typeof missionBv.$inferSelect;
export type MissionBvInsert = typeof missionBv.$inferInsert;
export type MissionPvrf = typeof missionPvrf.$inferSelect;
export type MissionPvrfInsert = typeof missionPvrf.$inferInsert;
export type MissionQs = typeof missionQs.$inferSelect;
export type MissionQsInsert = typeof missionQs.$inferInsert;
export type CommercialClient = typeof commercialClient.$inferSelect;
export type CommercialClientInsert = typeof commercialClient.$inferInsert;
export type CommercialEntreprise = typeof commercialEntreprise.$inferSelect;
export type CommercialEntrepriseInsert = typeof commercialEntreprise.$inferInsert;
export type MissionDocumentEvent = typeof missionDocumentEvent.$inferSelect;
export type MissionDocumentEventInsert = typeof missionDocumentEvent.$inferInsert;

export type DocStageStatus = "absent" | "present" | "avenant";

export type MissionBcDocStages = {
  fa: DocStageStatus;
  fs: DocStageStatus;
  rmi: DocStageStatus;
  bv: DocStageStatus;
  qs: DocStageStatus;
  pvrf: DocStageStatus;
};

export type BcWorkflowState = {
  bc: MissionBonCommande;
  designations: MissionBcDesignation[];
  frais: MissionBcFrais[];
  fa: MissionFa | null;
  fs: MissionFs[];
  rmi: MissionRmi | null;
  bv: MissionBv[];
  pvrf: MissionPvrf | null;
  qs: MissionQs | null;
  stages: MissionBcDocStages;
};

export type MissionWorkflowState = {
  missionId: string;
  bcs: BcWorkflowState[];
};

export type MissionBcSummaryRow = {
  bcId: string;
  label: string;
  bcKind: BonCommandeType;
  stages: MissionBcDocStages;
  amountHt: number;
  totalJeh: number;
  intervenantCount: number;
};

export type MissionRow = {
  id: string;
  missionName: string;
  clientId: string;
  clientNom: string | null;
  clientPrenom: string | null;
  clientTelephone: string | null;
  clientMail: string | null;
  clientName: string | null;
  entrepriseTelephone: string | null;
  entrepriseMail: string | null;
  entrepriseAdresse: string | null;
  entrepriseVille: string | null;
  entrepriseCodePostal: string | null;
  entreprisePays: string | null;
  entrepriseSiren: string | null;
  entrepriseName: string | null;
  cdpId: string | null;
  cdpName: string | null;
  entrepriseId: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  driveFolderId: string | null;
  slackChannelId: string | null;
  bcCount: number;
  totalAmountHt: number;
  totalJeh: number;
  totalIntervenantCount: number;
  bcSummaries: MissionBcSummaryRow[];
  updatedAt: Date;
};

export type MissionsKpi = {
  missions: number;
  bonCommandes: number;
  rmi: number;
  pvrf: number;
  qs: number;
  faReglees: number;
  fsReglees: number;
  bvVerses: number;
};

export type MissionFormOption = { id: string; label: string };
export type CdpFormOption = {
  id: string;
  label: string;
  email: string;
  hasAppUser: boolean;
};
export type MissionFormOptions = {
  clients: MissionFormOption[];
  entreprises: MissionFormOption[];
  cdps: CdpFormOption[];
};

export type CreateCommercialClientInput = {
  nomClient: string;
  prenomClient?: string;
  telephoneClient?: string;
  mailClient?: string;
};

export type CreateCommercialEntrepriseInput = {
  nomEntreprise: string;
  telephoneEntreprise?: string;
  mailEntreprise?: string;
  adresseEntreprise?: string;
  villeEntreprise?: string;
  codePostalEntreprise?: string;
  paysEntreprise?: string;
  sirenEntreprise?: string;
};

export type CreateMissionInput = {
  missionName: string;
  clientId: string;
  entrepriseId: string;
  cdpId?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  /** URL ou ID dossier Drive existant à lier à la création. */
  driveFolderIdOrUrl?: string | null;
  /** ID canal Slack existant à lier à la création. */
  slackChannelId?: string | null;
};

export type UpdateMissionInput = CreateMissionInput & { id: string };
