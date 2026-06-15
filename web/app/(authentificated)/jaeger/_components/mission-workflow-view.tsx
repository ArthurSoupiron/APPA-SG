"use client";

import { AlertCircle, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  BcWorkflowState,
  DocStageStatus,
} from "../_lib/missions-types";
import type {
  GestionnaireMissionsPermissions,
  TemplateDocType,
} from "../_lib/missions-types";
import type {
  DocMatrixCell,
  MissionBcDocsMatrixRow,
  MissionMissionLevelDocs,
} from "../_lib/missions-types";
import { assignDesignationIntervenant } from "../_lib/missions-api";
import type { WorkflowPrefetchedDocsMatrix } from "../_hooks/use-mission-workflow";
import { useMissionWorkflow } from "../_hooks/use-mission-workflow";
import { formatBcDisplayLabel } from "../_lib/format-bc-label";
import type { MatrixDocumentStepAction } from "../_lib/matrix-doc-click";
import { formatMoney, getDesignationTotalHt } from "../_lib/mission-money";
import { docMatrixStyles as dm } from "../_lib/doc-matrix.styles";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";
import { BcFormDialog } from "./bc-form-dialog";
import type { DocFormType } from "./doc-form-dialog";
import { DocFormDialog } from "./doc-form-dialog";
import { DocMatrixUnifiedPill } from "./doc-matrix-split";
import { TemplateGenerationDialog } from "./template-generation-dialog";
import { TemplateValidationDialog } from "./template-validation-dialog";

export type { WorkflowPrefetchedDocsMatrix };

type Props = {
  missionId: string;
  permissions: GestionnaireMissionsPermissions;
  actionRequest?: "create-bc" | "focus-events" | null;
  selectedBcIdRequest?: string | null;
  onActionConsumed?: () => void;
  /** Si la liste a déjà une matrice complète pour ce missionId, on hydrate le cache sans rappeler Drive. */
  prefetchedDocsMatrix?: WorkflowPrefetchedDocsMatrix;
  /** Appelé quand le workflowState est chargé — permet à l'explorer de mettre à jour la sidebar BC. */
  onBcListReady?: (bcList: Array<{ id: string; label: string }>) => void;
  /** Données initiales chargées en RSC — évite un POST au montage. */
  initialIntervenantOptions?: Array<{ id: string; label: string }>;
};

const STAGE_ORDER: Array<{
  key: DocFormType;
  label: string;
  optional?: boolean;
  description: string;
}> = [
  { key: "fa", label: "FA", description: "Facture d'acompte", optional: true },
  { key: "rmi", label: "RMI", description: "Récapitulatif de mission" },
  { key: "fs", label: "FS", description: "Facture de solde" },
  {
    key: "bv",
    label: "BV",
    description: "Bon de virement intervenant",
    optional: true,
  },
  {
    key: "qs",
    label: "QS/PVRI",
    description: "Procès-verbal réception initiale",
    optional: true,
  },
  { key: "pvrf", label: "PVRF", description: "Procès-verbal réception finale" },
];

function StatusBadge({ status }: { status: DocStageStatus }) {
  if (status === "absent") {
    return (
      <span className="inline-flex items-center gap-1 border border-slate-300/85 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-white/8 dark:text-slate-400">
        Absent
      </span>
    );
  }
  if (status === "avenant") {
    return (
      <span className="inline-flex items-center gap-1 border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-400/45 dark:bg-amber-500/14 dark:text-amber-300">
        <AlertCircle className="h-2.5 w-2.5" />
        Avenant
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-400/45 dark:bg-emerald-500/14 dark:text-emerald-300">
      <CheckCircle2 className="h-2.5 w-2.5" />
      Présent
    </span>
  );
}

function DocumentStageCard({
  stage,
  status,
  missionId,
  bcId,
  permissions,
  onCreated,
}: {
  stage: (typeof STAGE_ORDER)[number];
  status: DocStageStatus;
  missionId: string;
  bcId: string;
  permissions: GestionnaireMissionsPermissions;
  onCreated: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const isAbsent = status === "absent";
  const actionLabel = isAbsent ? "Créer" : "Avenant";
  const templateDocType =
    stage.key === "rmi"
      ? isAbsent
        ? "RMI"
        : "ARMI"
      : stage.key === "pvrf"
        ? "PVRF"
        : null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-slate-300/85 px-3 py-2 last:border-b-0 dark:border-white/8",
        !isAbsent && "bg-slate-50/40 dark:bg-background/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
        <div className="min-w-0">
          <span className="text-xs font-medium">{stage.label}</span>
          {stage.optional && (
            <span className="ml-1 text-[10px] text-slate-400">(opt.)</span>
          )}
          <p className="text-[10px] text-muted-foreground">
            {stage.description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={status} />
        {templateDocType &&
          (() => {
            const canGenerate = permissions.canGenerateByDoc[templateDocType];
            return (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={cn(gm.actionButton, "h-6 px-2 text-[10px]")}
                  onClick={() => setTemplateDialogOpen(true)}
                  disabled={!canGenerate}
                >
                  Template
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={cn(gm.actionButton, "h-6 px-2 text-[10px]")}
                  onClick={() => setValidationDialogOpen(true)}
                  disabled={!permissions.canValidateByDoc[templateDocType]}
                >
                  Valider PDF
                </Button>
              </>
            );
          })()}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(gm.actionButton, "h-6 px-2 text-[10px]")}
          onClick={() => setDialogOpen(true)}
          disabled={!permissions.canManageBcStructure}
        >
          {actionLabel}
        </Button>
      </div>

      {dialogOpen && (
        <DocFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          type={stage.key}
          missionId={missionId}
          bcId={bcId}
          isAvenant={!isAbsent}
          onSuccess={() => {
            setDialogOpen(false);
            onCreated();
          }}
        />
      )}
      {templateDocType && templateDialogOpen && (
        <TemplateGenerationDialog
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          missionId={missionId}
          bcId={bcId}
          documentType={templateDocType}
          defaultNumber={`${templateDocType}-${new Date().getFullYear()}`}
          canGenerate={permissions.canGenerateByDoc[templateDocType]}
          onSuccess={onCreated}
        />
      )}
      {templateDocType && validationDialogOpen && (
        <TemplateValidationDialog
          open={validationDialogOpen}
          onOpenChange={setValidationDialogOpen}
          missionId={missionId}
          bcId={bcId}
          documentType={templateDocType}
          canValidate={permissions.canValidateByDoc[templateDocType]}
          onSuccess={onCreated}
        />
      )}
    </div>
  );
}

const MISSION_STRIP_WF: Array<{
  label: string;
  pick: (m: MissionMissionLevelDocs) => {
    docx: DocMatrixCell;
    pdf: DocMatrixCell;
  };
  showDocx: boolean;
  driveOnly?: boolean;
}> = [
  {
    label: "Propale",
    pick: (m) => m.propale,
    showDocx: false,
    driveOnly: true,
  },
  { label: "CDC", pick: (m) => m.cdc, showDocx: false, driveOnly: true },
  { label: "CCA", pick: (m) => m.cca, showDocx: true },
];

const BC_DOC_GROUPS_WF: Array<{
  label: string;
  docx: keyof MissionBcDocsMatrixRow["docs"];
  pdf: keyof MissionBcDocsMatrixRow["docs"];
}> = [
  { label: "BC", docx: "bcDocx", pdf: "bcPdf" },
  { label: "FA", docx: "faDocx", pdf: "faPdf" },
  { label: "RMI", docx: "rmiDocx", pdf: "rmiPdf" },
  { label: "FS", docx: "fsDocx", pdf: "fsPdf" },
  { label: "PVRF", docx: "pvrfDocx", pdf: "pvrfPdf" },
  { label: "BV", docx: "bvDocx", pdf: "bvPdf" },
  { label: "QS", docx: "qsDocx", pdf: "qsPdf" },
];

function BcPanel({
  bcState,
  docsMatrixRow,
  missionLevelDocs,
  missionId,
  intervenantOptions,
  onAssignIntervenant,
  onEditBc,
  permissions,
  onRefresh,
}: {
  bcState: BcWorkflowState;
  docsMatrixRow: MissionBcDocsMatrixRow | null;
  missionLevelDocs: MissionMissionLevelDocs | null;
  missionId: string;
  intervenantOptions: Array<{ id: string; label: string }>;
  onAssignIntervenant: (
    designationId: string,
    intervenantId: string | null,
  ) => Promise<void>;
  onEditBc: () => void;
  permissions: GestionnaireMissionsPermissions;
  onRefresh: () => void;
}) {
  const [genDocType, setGenDocType] = useState<TemplateDocType | null>(null);
  const [valDocType, setValDocType] = useState<TemplateDocType | null>(null);

  const handleDocMatrixStep = useCallback((step: MatrixDocumentStepAction) => {
    if (step.kind === "generate") setGenDocType(step.docType);
    else setValDocType(step.docType);
  }, []);
  const [assignStatusByDesignation, setAssignStatusByDesignation] = useState<
    Record<string, "idle" | "saving" | "saved" | "error">
  >({});

  const [activeTab, setActiveTab] = useState<"recap" | "documents">("recap");
  const designationTotalHt = bcState.designations.reduce(
    (sum, d) => sum + getDesignationTotalHt(d),
    0,
  );
  const fraisTotalHt = bcState.frais.reduce(
    (sum, f) => sum + (Number(f.montantHt ?? 0) || 0),
    0,
  );
  const bonGlobalHt = designationTotalHt + fraisTotalHt;
  const _docColumns = BC_DOC_GROUPS_WF.flatMap((g) => [
    { key: g.docx, label: `${g.label}·DX` },
    { key: g.pdf, label: `${g.label}·PDF` },
  ]);

  return (
    <div className={cn(gm.sectionContainer, "flex flex-col")}>
      <div className={cn(gm.sectionHeader)}>
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold">
              {formatBcDisplayLabel(bcState.bc.type, bcState.bc.bcNumber)}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {bcState.bc.livre ? "Livré" : "En cours"}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(gm.actionButton, "h-6 px-2 text-[10px]")}
            onClick={onEditBc}
            disabled={!permissions.canManageBcStructure}
          >
            Modifier BC
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(gm.actionButton, "h-6 px-2 text-[10px]")}
            onClick={() => setGenDocType("BC")}
            disabled={!permissions.canGenerateByDoc.BC}
          >
            Template BC
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(gm.actionButton, "h-6 px-2 text-[10px]")}
            onClick={() => setValDocType("BC")}
            disabled={!permissions.canValidateByDoc.BC}
          >
            Valider BC PDF
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(gm.actionButton, "h-6 px-2 text-[10px]")}
            onClick={() => setGenDocType("BCR")}
            disabled={!permissions.canGenerateByDoc.BCR}
          >
            Template BCR
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(gm.actionButton, "h-6 px-2 text-[10px]")}
            onClick={() => setValDocType("BCR")}
            disabled={!permissions.canValidateByDoc.BCR}
          >
            Valider BCR PDF
          </Button>
        </div>
      </div>
      <div>
        {missionLevelDocs ? (
          <div className={dm.layout.workflow.subsectionBorder}>
            <div className={dm.layout.workflow.missionDocsFlex}>
              {MISSION_STRIP_WF.map(({ label, pick, showDocx, driveOnly }) => {
                const pair = pick(missionLevelDocs);
                return (
                  <div
                    key={label}
                    className={dm.layout.workflow.missionPillWrap}
                  >
                    <DocMatrixUnifiedPill
                      groupLabel={label}
                      docxCell={pair.docx}
                      pdfCell={pair.pdf}
                      loading={false}
                      showDocx={showDocx}
                      driveOnly={Boolean(driveOnly)}
                      matrixPanel={{ permissions }}
                      onMatrixStep={handleDocMatrixStep}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        <div className={dm.layout.workflow.subsectionBorder}>
          <p className={dm.layout.workflow.subsectionTitle}>
            Documents du BC sélectionné —{" "}
            <span className={dm.layout.workflow.subsectionTitleMuted}>
              même code B | D
            </span>
          </p>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {BC_DOC_GROUPS_WF.map(({ label, docx, pdf }) => {
              const empty: DocMatrixCell = { bdd: "absent", drive: "absent" };
              const docxCell = docsMatrixRow?.docs[docx] ?? empty;
              const pdfCell = docsMatrixRow?.docs[pdf] ?? empty;
              return (
                <div key={label} className={dm.layout.workflow.bcGridCell}>
                  <DocMatrixUnifiedPill
                    groupLabel={label}
                    docxCell={docxCell}
                    pdfCell={pdfCell}
                    loading={false}
                    matrixPanel={{
                      permissions,
                      bcKind: bcState.bc.type,
                      rmiTemplate:
                        bcState.stages.rmi === "absent" ? "RMI" : "ARMI",
                    }}
                    onMatrixStep={handleDocMatrixStep}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-1 border-b border-slate-300/85 px-3 py-2 dark:border-white/8">
          <button
            type="button"
            onClick={() => setActiveTab("recap")}
            className={cn(
              "px-2 py-1 text-xs font-medium transition-colors",
              activeTab === "recap"
                ? "border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-400/45 dark:bg-amber-500/14 dark:text-amber-200"
                : "border border-slate-300/85 text-muted-foreground hover:bg-slate-100/70 dark:border-white/8 dark:hover:bg-white/6",
            )}
          >
            Récap BC
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={cn(
              "px-2 py-1 text-xs font-medium transition-colors",
              activeTab === "documents"
                ? "border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-400/45 dark:bg-amber-500/14 dark:text-amber-200"
                : "border border-slate-300/85 text-muted-foreground hover:bg-slate-100/70 dark:border-white/8 dark:hover:bg-white/6",
            )}
          >
            Documents
          </button>
        </div>
        {activeTab === "recap" && (
          <>
            <div className="grid grid-cols-1 gap-2 border-b border-slate-300/85 bg-slate-100/55 p-3 dark:border-white/8 dark:bg-white/5 md:grid-cols-3">
              <div className="border border-amber-300/70 bg-amber-50/60 p-2 dark:border-amber-400/35 dark:bg-amber-500/10">
                <p className="text-[10px] text-muted-foreground">
                  Total désignations
                </p>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  HT {formatMoney(String(designationTotalHt))}
                </p>
              </div>
              <div className="border border-emerald-300/70 bg-emerald-50/60 p-2 dark:border-emerald-400/35 dark:bg-emerald-500/10">
                <p className="text-[10px] text-muted-foreground">Total frais</p>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  HT {formatMoney(String(fraisTotalHt))}
                </p>
              </div>
              <div className="border border-sky-300/70 bg-sky-50/60 p-2 dark:border-sky-400/35 dark:bg-sky-500/10">
                <p className="text-[10px] text-muted-foreground">
                  Total global BC
                </p>
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                  HT {formatMoney(String(bonGlobalHt))}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 border-b border-slate-300/85 p-3 dark:border-white/8 md:grid-cols-2">
              <div className={cn(gm.sectionContainer)}>
                <div className={cn(gm.sectionHeader, "px-3 py-2")}>
                  <p className="text-[11px] font-semibold">Désignations</p>
                </div>
                <div className="p-2">
                  {bcState.designations.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">
                      Aucune désignation.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {bcState.designations.map((d) => (
                        <div
                          key={d.id}
                          className="border border-slate-300/85 p-2 text-[10px] dark:border-white/8"
                        >
                          <p className="font-medium">{d.titre}</p>
                          {d.description && (
                            <p className="text-muted-foreground">
                              {d.description}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                            JEH: {d.nbJeh ?? "-"}
                          </p>
                          <p className="text-muted-foreground">
                            Montant par JEH: {formatMoney(d.montantJeh)}
                          </p>
                          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            Montant total HT:{" "}
                            {formatMoney(String(getDesignationTotalHt(d)))}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <select
                              className="h-7 border border-slate-300/85 bg-slate-50 px-2 text-[10px] text-slate-900 dark:border-white/8 dark:bg-slate-900 dark:text-slate-100"
                              value={d.intervenantId ?? ""}
                              disabled={!permissions.canManageBcStructure}
                              onChange={async (e) => {
                                setAssignStatusByDesignation((prev) => ({
                                  ...prev,
                                  [d.id]: "saving",
                                }));
                                try {
                                  await onAssignIntervenant(
                                    d.id,
                                    e.target.value || null,
                                  );
                                  setAssignStatusByDesignation((prev) => ({
                                    ...prev,
                                    [d.id]: "saved",
                                  }));
                                  setTimeout(() => {
                                    setAssignStatusByDesignation((prev) => ({
                                      ...prev,
                                      [d.id]: "idle",
                                    }));
                                  }, 1500);
                                } catch {
                                  setAssignStatusByDesignation((prev) => ({
                                    ...prev,
                                    [d.id]: "error",
                                  }));
                                }
                              }}
                            >
                              <option value="">Aucun intervenant</option>
                              {intervenantOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {assignStatusByDesignation[d.id] === "saving" && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-300">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Enregistrement...
                              </span>
                            )}
                            {assignStatusByDesignation[d.id] === "saved" && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                Validé
                              </span>
                            )}
                            {assignStatusByDesignation[d.id] === "error" && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-600 dark:text-red-300">
                                <AlertCircle className="h-3 w-3" />
                                Erreur
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={cn(gm.sectionContainer)}>
                <div className={cn(gm.sectionHeader, "px-3 py-2")}>
                  <p className="text-[11px] font-semibold">Frais</p>
                </div>
                <div className="p-2">
                  {bcState.frais.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">
                      Aucun frais.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {bcState.frais.map((f) => (
                        <div
                          key={f.id}
                          className="border border-slate-300/85 p-2 text-[10px] dark:border-white/8"
                        >
                          <p className="font-medium">{f.texte}</p>
                          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            HT: {formatMoney(f.montantHt)} | TVA: {f.tva ?? "-"}
                            %
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        {activeTab === "documents" &&
          STAGE_ORDER.map((stage) => (
            <DocumentStageCard
              key={stage.key}
              stage={stage}
              status={bcState.stages[stage.key as keyof typeof bcState.stages]}
              missionId={missionId}
              bcId={bcState.bc.id}
              permissions={permissions}
              onCreated={onRefresh}
            />
          ))}
      </div>
      {genDocType && (
        <TemplateGenerationDialog
          open
          onOpenChange={(open) => {
            if (!open) setGenDocType(null);
          }}
          missionId={missionId}
          bcId={genDocType === "CCA" ? null : bcState.bc.id}
          documentType={genDocType}
          defaultNumber={`${genDocType}-${new Date().getFullYear()}`}
          canGenerate={permissions.canGenerateByDoc[genDocType]}
          onSuccess={() => {
            setGenDocType(null);
            onRefresh();
          }}
        />
      )}
      {valDocType && (
        <TemplateValidationDialog
          open
          onOpenChange={(open) => {
            if (!open) setValDocType(null);
          }}
          missionId={missionId}
          bcId={valDocType === "CCA" ? null : bcState.bc.id}
          documentType={valDocType}
          canValidate={permissions.canValidateByDoc[valDocType]}
          onSuccess={() => {
            setValDocType(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

export function MissionWorkflowView({
  missionId,
  permissions,
  actionRequest,
  selectedBcIdRequest,
  onActionConsumed,
  prefetchedDocsMatrix,
  onBcListReady,
  initialIntervenantOptions,
}: Props) {
  const {
    workflowState,
    selectedBcState,
    selectedBcMatrixRow,
    missionLevelDocs,
    intervenantOptions,
    suggestedBcNumber,
    isBcDialogOpen,
    setIsBcDialogOpen,
    editingBcId,
    setEditingBcId,
    loadData,
  } = useMissionWorkflow({
    missionId,
    permissions,
    actionRequest,
    selectedBcIdRequest,
    onActionConsumed,
    prefetchedDocsMatrix,
    onBcListReady,
    initialIntervenantOptions,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {!selectedBcState ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-xs text-muted-foreground">
              <FileText className="h-8 w-8 opacity-20" />
              {workflowState?.bcs.length === 0 ? (
                <>
                  <p>Aucun bon de commande pour cette mission.</p>
                  {permissions.canManageBcStructure ? (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-none"
                      onClick={() => {
                        setEditingBcId(null);
                        setIsBcDialogOpen(true);
                      }}
                    >
                      Créer le premier bon de commande
                    </Button>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-300">
                      Permission requise : structure mission / BC.
                    </p>
                  )}
                </>
              ) : (
                <p>Sélectionnez un BC depuis le panel de gauche.</p>
              )}
            </div>
          ) : (
            <div className="p-3">
              <BcPanel
                bcState={selectedBcState}
                docsMatrixRow={selectedBcMatrixRow}
                missionLevelDocs={missionLevelDocs}
                missionId={missionId}
                permissions={permissions}
                intervenantOptions={intervenantOptions}
                onAssignIntervenant={async (designationId, intervenantId) => {
                  await assignDesignationIntervenant(
                    missionId,
                    selectedBcState.bc.id,
                    designationId,
                    intervenantId,
                  );
                  loadData(true);
                }}
                onEditBc={() => {
                  setEditingBcId(selectedBcState.bc.id);
                  setIsBcDialogOpen(true);
                }}
                onRefresh={() => loadData(true)}
              />
            </div>
          )}
        </div>
      </div>
      <BcFormDialog
        open={isBcDialogOpen}
        onOpenChange={(open) => {
          setIsBcDialogOpen(open);
          if (!open) setEditingBcId(null);
        }}
        missionId={missionId}
        suggestedNumber={suggestedBcNumber}
        bcId={editingBcId ?? undefined}
        mode={editingBcId ? "edit" : "create"}
        onSuccess={() => loadData(true)}
      />
    </div>
  );
}
