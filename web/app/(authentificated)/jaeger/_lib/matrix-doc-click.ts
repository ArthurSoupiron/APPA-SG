import type {
  BonCommandeType,
  DocMatrixCell,
  GestionnaireMissionsPermissions,
  TemplateDocType,
} from "./missions-types";

export type MatrixDocumentStepAction = {
  kind: "generate" | "validate";
  docType: TemplateDocType;
};

export type MatrixBlockStep = {
  id: string;
  action: MatrixDocumentStepAction;
  label: string;
  description?: string;
};

export type MatrixBlockPanel = {
  title: string;
  steps: MatrixBlockStep[];
  footerNote?: string;
};

function templateDocTypeForGroup(
  groupLabel: string,
  opts: { bcKind?: BonCommandeType; rmiTemplate?: "RMI" | "ARMI" },
): TemplateDocType | null {
  if (groupLabel === "CCA") return "CCA";
  if (groupLabel === "BC") return opts.bcKind === "BCR" ? "BCR" : "BC";
  if (groupLabel === "RMI") return opts.rmiTemplate ?? "RMI";
  if (groupLabel === "PVRF") return "PVRF";
  return null;
}

function cellNeedsPipelineDocx(c: DocMatrixCell | undefined): boolean {
  if (!c) return true;
  return (
    c.bdd === "pending_drive" ||
    c.bdd === "absent" ||
    c.bdd === "inconsistency" ||
    c.bdd === "error" ||
    c.drive === "absent" ||
    c.drive === "trashed"
  );
}

function cellNeedsPipelinePdf(c: DocMatrixCell | undefined): boolean {
  if (!c) return true;
  return c.drive === "absent" || c.drive === "trashed" || c.drive === "inconsistency";
}

export function buildMatrixBlockPanel(input: {
  groupLabel: string;
  docxCell?: DocMatrixCell;
  pdfCell?: DocMatrixCell;
  showDocx: boolean;
  driveOnly: boolean;
  permissions: GestionnaireMissionsPermissions;
  bcKind?: BonCommandeType;
  rmiTemplate?: "RMI" | "ARMI";
}): MatrixBlockPanel {
  const {
    groupLabel,
    docxCell,
    pdfCell,
    showDocx,
    driveOnly,
    permissions,
    bcKind,
    rmiTemplate,
  } = input;

  const docType = templateDocTypeForGroup(groupLabel, { bcKind, rmiTemplate });
  const steps: MatrixBlockStep[] = [];

  if (!docType) {
    return {
      title: groupLabel,
      steps: [],
      footerNote:
        "Pas de génération DOCX ni validation PDF depuis ce bloc. Utilisez l’onglet Workflow (FA, FS, BV, QS) ou gérez les fichiers sur Drive (Propale / CDC).",
    };
  }

  const pdfReady = driveOnly
    ? pdfCell?.drive === "present"
    : pdfCell?.bdd === "synced" && pdfCell?.drive === "present";

  const needGen = showDocx && !driveOnly && cellNeedsPipelineDocx(docxCell);
  const needVal = !driveOnly && cellNeedsPipelinePdf(pdfCell);

  if (needGen && permissions.canGenerateByDoc[docType]) {
    steps.push({
      id: "gen-docx",
      action: { kind: "generate", docType },
      label: "Générer le document DOCX",
      description: "À partir du modèle : fichier sur Drive + lien en base.",
    });
  }

  if (needVal && permissions.canValidateByDoc[docType]) {
    steps.push({
      id: "val-pdf",
      action: { kind: "validate", docType },
      label: "Valider / enregistrer le PDF",
      description:
        "Conversion DOCX → PDF via export Google Drive, puis mise à jour du generated_file_id en base.",
    });
  }

  let footerNote: string | undefined;
  if (steps.length === 0) {
    if (pdfReady) {
      footerNote = "Parcours courant terminé : PDF prêt à envoyer pour ce document.";
    } else if (needGen && !permissions.canGenerateByDoc[docType]) {
      footerNote = "Une génération DOCX serait utile, mais vous n’avez pas la permission.";
    } else if (needVal && !permissions.canValidateByDoc[docType]) {
      footerNote = "Une validation PDF serait utile, mais vous n’avez pas la permission.";
    } else if (!needGen && !needVal) {
      footerNote = "Aucune étape automatique supplémentaire détectée pour cet état.";
    }
  }

  return { title: groupLabel, steps, footerNote };
}
