/** Types UI gestionnaire de missions (alignés backend `src/types/missions.ts` + matrice / templates). */

export type BonCommandeType = "BC" | "BCR";

export type DocStageStatus = "absent" | "present" | "avenant";

export type BddMatrixStatus =
  | "absent"
  | "pending_drive"
  | "synced"
  | "inconsistency"
  | "error";

export type DriveMatrixStatus = "absent" | "present" | "trashed" | "inconsistency";

export type DocMatrixCell = {
  bdd: BddMatrixStatus;
  drive: DriveMatrixStatus;
  issueBdd?: string;
  issueDrive?: string;
};

export type MissionMissionLevelDocs = {
  cdc: { docx: DocMatrixCell; pdf: DocMatrixCell };
  propale: { docx: DocMatrixCell; pdf: DocMatrixCell };
  cca: { docx: DocMatrixCell; pdf: DocMatrixCell };
};

export type MissionBcDocsMatrixRow = {
  bcId: string;
  bcLabel: string;
  docs: {
    bcDocx: DocMatrixCell;
    bcPdf: DocMatrixCell;
    faDocx: DocMatrixCell;
    faPdf: DocMatrixCell;
    fsDocx: DocMatrixCell;
    fsPdf: DocMatrixCell;
    rmiDocx: DocMatrixCell;
    rmiPdf: DocMatrixCell;
    pvrfDocx: DocMatrixCell;
    pvrfPdf: DocMatrixCell;
    bvDocx: DocMatrixCell;
    bvPdf: DocMatrixCell;
    qsDocx: DocMatrixCell;
    qsPdf: DocMatrixCell;
  };
};

export type MissionDocsMatrix = {
  mission: MissionMissionLevelDocs;
  rows: MissionBcDocsMatrixRow[];
};

export type MissionBcDocStages = {
  fa: DocStageStatus;
  fs: DocStageStatus;
  rmi: DocStageStatus;
  bv: DocStageStatus;
  qs: DocStageStatus;
  pvrf: DocStageStatus;
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
  startDate: string | Date | null;
  endDate: string | Date | null;
  driveFolderId: string | null;
  slackChannelId: string | null;
  bcCount: number;
  totalAmountHt: number;
  totalJeh: number;
  totalIntervenantCount: number;
  bcSummaries: MissionBcSummaryRow[];
  missionLevelDocs: MissionMissionLevelDocs | null;
  bcDocsMatrixRows: MissionBcDocsMatrixRow[];
  updatedAt: string | Date;
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
export type MissionFormOptions = {
  clients: MissionFormOption[];
  entreprises: MissionFormOption[];
  cdps: CdpFormOption[];
};

export type CreateMissionInput = {
  missionName: string;
  clientId: string;
  entrepriseId: string;
  cdpId?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  driveFolderIdOrUrl?: string | null;
  slackChannelId?: string | null;
};

export type UpdateMissionInput = CreateMissionInput & { id: string };

export type MissionCreateIntegrationOptions = {
  driveAvailable: boolean;
  driveError?: string;
  driveFolders: MissionDriveFolderOption[];
  slackAvailable: boolean;
  slackError?: string;
  slackChannels: SlackChannelOption[];
};

export type MissionDriveFolderOption = {
  id: string;
  name: string;
  year: string;
  label: string;
  webViewLink: string;
  linkedMissionName: string | null;
};

export type MissionDriveCommercialInfosResult = {
  found: boolean;
  fileName?: string;
  webViewLink?: string;
  client?: CreateCommercialClientInput;
  entreprise?: CreateCommercialEntrepriseInput;
  warnings?: string[];
  error?: string;
};

export type SlackChannelOption = { id: string; name: string };
export type MissionIntegrationState = {
  pluginsReady: boolean;
  drive: {
    linked: boolean;
    valid: boolean;
    issue: string | null;
    url: string | null;
  };
  slack: {
    linked: boolean;
    valid: boolean;
    issue: string | null;
    channelId: string | null;
    url: string | null;
  };
  statusColor: "gray" | "green" | "orange";
  slackChannels: SlackChannelOption[];
  configuredSlackGroups: Array<{ id: string; name: string }>;
};

export type SlackGroupOption = {
  id: string;
  name: string;
  handle: string;
  isDisabled: boolean;
  selected: boolean;
};

export type TemplateDocType = "CCA" | "BC" | "BCR" | "RMI" | "ARMI" | "PVRF";

export type GestionnaireMissionsPermissions = {
  canGenerateTemplates: boolean;
  canValidateDocuments: boolean;
  canManageBcStructure: boolean;
  canManageIntegrations: boolean;
  canManageSlackGroups: boolean;
  canManagePermissions: boolean;
  canSyncTemplates: boolean;
  canUseSlackDebug: boolean;
  canGenerateByDoc: Record<TemplateDocType, boolean>;
  canValidateByDoc: Record<TemplateDocType, boolean>;
};

export type CdpFormOption = {
  id: string;
  label: string;
  email: string;
  hasAppUser: boolean;
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

export const TEMPLATE_DOCS: TemplateDocType[] = [
  "CCA",
  "BC",
  "BCR",
  "RMI",
  "ARMI",
  "PVRF",
];

export type MissionBonCommande = {
  id: string;
  missionId: string;
  bcNumber: string;
  type: BonCommandeType;
  livre: boolean;
};

export type MissionBcDesignation = {
  id: string;
  bcId: string;
  titre: string;
  description: string | null;
  nbJeh: number | null;
  montantJeh: string | null;
  prixTotalHt: string | null;
  intervenantId: string | null;
};

export type MissionBcFrais = {
  id: string;
  bcId: string;
  texte: string;
  montantHt: string | null;
  tva: string | null;
};

export type BcWorkflowState = {
  bc: MissionBonCommande;
  designations: MissionBcDesignation[];
  frais: MissionBcFrais[];
  fa: { id: string } | null;
  fs: { id: string }[];
  rmi: { id: string } | null;
  bv: { id: string }[];
  pvrf: { id: string } | null;
  qs: { id: string } | null;
  stages: MissionBcDocStages;
};

export type MissionWorkflowState = {
  missionId: string;
  bcs: BcWorkflowState[];
};

export type BcEditorData = {
  bcNumber: string;
  designations: Array<{
    id: string;
    titre: string;
    description: string | null;
    nbJeh: number | null;
    montantJeh: string | null;
  }>;
  frais: Array<{
    id: string;
    texte: string;
    montantHt: string | null;
    tva: string | null;
  }>;
};

export type MissionEventWithActor = {
  id: string;
  missionId: string;
  bcId: string | null;
  entityType: string;
  entityId: string;
  eventType: string;
  revisionNumber: number | null;
  label: string;
  changedBy: string | null;
  changedAt: string | Date;
  actorName: string | null;
  actorEmail: string | null;
};

export type IntervenantOption = { id: string; label: string };

export type DocsMatrixHydrateSlice = {
  missionId: string;
  missionLevelDocs: MissionMissionLevelDocs | null;
  bcDocsMatrixRows: MissionBcDocsMatrixRow[];
};

export type TemplateGenerationFormData = {
  tags: string[];
  prefill: Record<string, string>;
  generationTargets: Array<{
    id: string;
    label: string;
    name: string | null;
    email: string | null;
  }>;
};

export type PendingTemplateFile = {
  id: string;
  name: string;
  webViewLink: string;
};

export type ListDriveMissionTemplatesResult = {
  ok: boolean;
  error?: string;
  folderUrl?: string;
  items: Array<{
    id: string;
    name: string;
    kind: "docx" | "google_doc";
    webViewLink: string;
    tags: string[];
    error?: string;
  }>;
};

