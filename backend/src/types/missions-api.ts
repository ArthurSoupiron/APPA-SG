import type { BonCommandeType } from "../db/schema/mission/enums";
import type { MissionBcSummaryRow, MissionFormOptions, MissionRow, MissionsKpi } from "./missions";

export type TemplateDocType = "CCA" | "BC" | "BCR" | "RMI" | "ARMI" | "PVRF";

export const TEMPLATE_DOCS: TemplateDocType[] = [
  "CCA",
  "BC",
  "BCR",
  "RMI",
  "ARMI",
  "PVRF",
];

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

export type MissionDocsMatrixListSlice = {
  missionId: string;
  missionLevelDocs: MissionMissionLevelDocs | null;
  bcDocsMatrixRows: MissionBcDocsMatrixRow[];
};

export type SlackGroupOption = {
  id: string;
  name: string;
  handle: string;
  isDisabled: boolean;
  selected: boolean;
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

export type PendingTemplateFile = {
  id: string;
  name: string;
  webViewLink: string;
};

export type MissionsListResponse = { missions: MissionRow[] };
export type MissionFormOptionsResponse = MissionFormOptions;
export type MissionsKpiResponse = MissionsKpi;

export type BcEditorData = {
  bcId: string;
  bcNumber: string;
  bcKind: BonCommandeType;
  designations: Array<{
    id: string;
    titre: string;
    description: string | null;
    nbJeh: number | null;
    montantJeh: string | null;
    prixTotalHt: string | null;
    intervenantId: string | null;
  }>;
  frais: Array<{
    id: string;
    texte: string;
    montantHt: string | null;
  }>;
};
