"use client";

import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  GestionnaireMissionsPermissions,
  MissionFormOptions,
  MissionRow,
  TemplateDocType,
} from "../_lib/missions-types";
import type { DocMatrixCell, MissionBcDocsMatrixRow } from "../_lib/missions-types";
import type { MatrixDocumentStepAction } from "../_lib/matrix-doc-click";
import { formatJeh, formatMoney } from "../_lib/mission-money";
import { docMatrixStyles as dm } from "../_lib/doc-matrix.styles";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";
import { DocMatrixUnifiedPill } from "./doc-matrix-split";
import { MissionFormDialog } from "./mission-form-dialog";
import { TemplateGenerationDialog } from "./template-generation-dialog";
import { TemplateValidationDialog } from "./template-validation-dialog";

type MissionsViewProps = {
  missions: MissionRow[];
  options: MissionFormOptions;
};
type MissionsViewActionProps = MissionsViewProps & {
  onSelectMission: (missionId: string) => void;
  selectedMissionId: string | null;
  permissions: GestionnaireMissionsPermissions;
  onRefresh?: () => void;
};

type BcDocKey = keyof MissionBcDocsMatrixRow["docs"];

const BC_DOC_GROUPS: Array<{ label: string; docx: BcDocKey; pdf: BcDocKey }> = [
  { label: "BC", docx: "bcDocx", pdf: "bcPdf" },
  { label: "FA", docx: "faDocx", pdf: "faPdf" },
  { label: "RMI", docx: "rmiDocx", pdf: "rmiPdf" },
  { label: "FS", docx: "fsDocx", pdf: "fsPdf" },
  { label: "PVRF", docx: "pvrfDocx", pdf: "pvrfPdf" },
  { label: "BV", docx: "bvDocx", pdf: "bvPdf" },
  { label: "QS", docx: "qsDocx", pdf: "qsPdf" },
];

const MISSION_STRIP: Array<{
  label: string;
  pick: (m: NonNullable<MissionRow["missionLevelDocs"]>) => {
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

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMissionDeadlineStatus(endDate: Date | string | null): {
  label: string;
  isOverdue: boolean;
} {
  if (!endDate) return { label: "—", isOverdue: false };
  const today = startOfDay(new Date());
  const end = startOfDay(new Date(endDate));
  const diffDays = Math.round((end.getTime() - today.getTime()) / 86_400_000);
  if (diffDays >= 0) return { label: `J-${diffDays}`, isOverdue: false };
  return { label: `J+${Math.abs(diffDays)}`, isOverdue: true };
}

function intervenantsLabel(count: number, scope: "mission" | "bc"): string {
  if (count === 0) {
    return scope === "mission"
      ? "Aucun intervenant (mission)"
      : "Aucun intervenant";
  }
  const n = count === 1 ? "intervenant" : "intervenants";
  return scope === "mission" ? `${count} ${n} (mission)` : `${count} ${n}`;
}

export function MissionsView({
  missions,
  options,
  onSelectMission,
  selectedMissionId,
  permissions,
  onRefresh,
}: MissionsViewActionProps) {
  const [isRefreshingList, startRefreshList] = useTransition();
  const [search, setSearch] = useState("");
  const [listGen, setListGen] = useState<{
    missionId: string;
    bcId: string | null;
    docType: TemplateDocType;
  } | null>(null);
  const [listVal, setListVal] = useState<{
    missionId: string;
    bcId: string | null;
    docType: TemplateDocType;
  } | null>(null);

  const handleListMatrixStep = useCallback(
    (
      missionId: string,
      step: MatrixDocumentStepAction,
      bcId: string | null,
    ) => {
      if (step.kind === "generate") {
        setListGen({ missionId, bcId, docType: step.docType });
      } else {
        setListVal({ missionId, bcId, docType: step.docType });
      }
    },
    [],
  );
  const normalizedSearch = search.trim().toLowerCase();
  const filteredMissions = useMemo(() => {
    if (!normalizedSearch) return missions;
    return missions.filter((mission) => {
      const searchableText = [
        mission.missionName,
        mission.clientName ?? "",
        mission.entrepriseName ?? "",
        mission.cdpName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return searchableText.includes(normalizedSearch);
    });
  }, [missions, normalizedSearch]);

  return (
    <div className={gm.sectionContainer}>
      <div className={gm.sectionHeader}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold">Section Missions</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
              title="Actualiser la liste des missions"
              disabled={isRefreshingList}
              onClick={() =>
                startRefreshList(() => {
                  onRefresh?.();
                })
              }
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  isRefreshingList && "animate-spin",
                )}
              />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Liste des missions et volume de bons de commande. Pastilles Propale
            / CDC (Drive seul) et CCA (B | D) : même lecture qu’en détail
            mission — la légende est dans le détail ou le workflow.
          </p>
        </div>
        <MissionFormDialog
          options={options}
          canManageMissions={permissions.canManageBcStructure}
          onSuccess={onRefresh}
        />
      </div>
      <div className="mb-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une mission, un client, une entreprise ou un CDP..."
          className="rounded-none bg-slate-50/70 dark:bg-background/60"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center align-middle">Mission</TableHead>
            <TableHead className="w-[56px] px-2 text-center align-middle">
              Drive
            </TableHead>
            <TableHead className="w-[56px] px-2 text-center align-middle">
              Slack
            </TableHead>
            <TableHead className={dm.layout.missions.tableHeadBcDocs}>
              BC / documents (B | D)
            </TableHead>
            <TableHead className="min-w-[220px] text-center align-middle">
              JEH / Montants / Interv.
            </TableHead>
            <TableHead className="min-w-[120px] text-center align-middle">
              Fin mission / J+·J-
            </TableHead>
            <TableHead className="whitespace-nowrap text-center align-middle">
              Derniere maj
            </TableHead>
            <TableHead className="w-[120px] text-center align-middle">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMissions.map((mission) =>
            (() => {
              const deadline = getMissionDeadlineStatus(mission.endDate);
              const bcRowsLoading =
                mission.bcSummaries.length > 0 &&
                mission.bcDocsMatrixRows.length === 0;
              return (
                <TableRow
                  key={mission.id}
                  className={
                    mission.id === selectedMissionId
                      ? "bg-slate-100/70 dark:bg-white/10"
                      : undefined
                  }
                >
                  <TableCell className="align-middle">
                    <button
                      type="button"
                      className="group flex w-full flex-col items-center justify-center gap-0.5 rounded-sm border border-amber-300/55 bg-amber-50/30 px-2 py-1 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors hover:border-amber-300/80 hover:bg-amber-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 dark:border-amber-400/25 dark:bg-amber-500/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:hover:border-amber-400/45 dark:hover:bg-amber-500/14"
                      onClick={() => onSelectMission(mission.id)}
                      title="Ouvrir le detail de la mission"
                    >
                      <p className="font-medium">{mission.missionName}</p>
                      <p className={gm.infoSubline}>
                        {mission.clientName ?? "Client inconnu"} -{" "}
                        {mission.cdpName ?? "CDP non assigne"}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 opacity-85 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-amber-300">
                        Voir le detail
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="px-2 py-2 align-middle">
                    <div className="flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            gm.statusSquare,
                            mission.driveFolderId
                              ? gm.statusGreen
                              : gm.statusGray,
                          )}
                        />
                        {mission.driveFolderId ? (
                          <a
                            href={`https://drive.google.com/drive/folders/${mission.driveFolderId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Ouvrir le dossier Drive"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2 align-middle">
                    <div className="flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            gm.statusSquare,
                            mission.slackChannelId
                              ? gm.statusGreen
                              : gm.statusGray,
                          )}
                        />
                        {mission.slackChannelId ? (
                          <a
                            href={`https://app.slack.com/client/T00000000/${mission.slackChannelId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Ouvrir le canal Slack"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={dm.layout.missions.tableCellMatrix}>
                    <div className={dm.layout.missions.matrixColumn}>
                      {mission.bcSummaries.length === 0 ? (
                        <span className={dm.layout.missions.emptyDash}>—</span>
                      ) : (
                        <>
                          <div className={dm.layout.missions.missionStripRow}>
                            {MISSION_STRIP.map(
                              ({ label, pick, showDocx, driveOnly }) => {
                                const strip = mission.missionLevelDocs;
                                const pair = strip ? pick(strip) : undefined;
                                const loading = !strip;
                                return (
                                  <DocMatrixUnifiedPill
                                    key={label}
                                    groupLabel={label}
                                    docxCell={loading ? undefined : pair?.docx}
                                    pdfCell={loading ? undefined : pair?.pdf}
                                    loading={loading}
                                    showDocx={showDocx}
                                    variant="compact"
                                    driveOnly={Boolean(driveOnly)}
                                    matrixPanel={
                                      loading ? undefined : { permissions }
                                    }
                                    onMatrixStep={
                                      loading
                                        ? undefined
                                        : (step) =>
                                            handleListMatrixStep(
                                              mission.id,
                                              step,
                                              null,
                                            )
                                    }
                                  />
                                );
                              },
                            )}
                          </div>
                          {mission.bcSummaries.map((bc) => {
                            const matrixRow = mission.bcDocsMatrixRows.find(
                              (r) => r.bcId === bc.bcId,
                            );
                            return (
                              <div
                                key={bc.bcId}
                                className={dm.layout.missions.bcRow}
                                title={bc.label}
                              >
                                <span className={dm.layout.missions.bcLabel}>
                                  {bc.label}
                                </span>
                                <div
                                  className={dm.layout.missions.pillsScroller}
                                >
                                  <div className={dm.layout.missions.pillsRow}>
                                    {BC_DOC_GROUPS.map(
                                      ({ label: docLabel, docx, pdf }) => (
                                        <DocMatrixUnifiedPill
                                          key={docLabel}
                                          groupLabel={docLabel}
                                          docxCell={matrixRow?.docs[docx]}
                                          pdfCell={matrixRow?.docs[pdf]}
                                          loading={bcRowsLoading}
                                          variant="compact"
                                          matrixPanel={
                                            bcRowsLoading
                                              ? undefined
                                              : {
                                                  permissions,
                                                  bcKind: bc.bcKind,
                                                  rmiTemplate:
                                                    bc.stages.rmi === "absent"
                                                      ? "RMI"
                                                      : "ARMI",
                                                }
                                          }
                                          onMatrixStep={
                                            bcRowsLoading
                                              ? undefined
                                              : (step) =>
                                                  handleListMatrixStep(
                                                    mission.id,
                                                    step,
                                                    bc.bcId,
                                                  )
                                          }
                                        />
                                      ),
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-1 align-middle">
                    <div className="flex min-w-0 flex-col items-center justify-center gap-y-1 text-center">
                      <div className="flex w-full max-w-[220px] flex-col gap-1 border border-slate-300/85 px-1.5 py-1 dark:border-white/8">
                        <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                          <span className="inline-flex items-center gap-1 rounded-sm border border-sky-400/80 bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-950 shadow-sm dark:border-sky-400/45 dark:bg-sky-500/20 dark:text-sky-50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                            <span className="text-sky-900 dark:text-sky-100/95">
                              JEH
                            </span>
                            <span className="tabular-nums text-sky-950 dark:text-sky-50">
                              {formatJeh(mission.totalJeh)}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-sm border border-amber-400/80 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950 shadow-sm dark:border-amber-400/45 dark:bg-amber-500/20 dark:text-amber-50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                            <span className="text-amber-900 dark:text-amber-100/95">
                              HT
                            </span>
                            <span className="tabular-nums text-amber-950 dark:text-amber-50">
                              {formatMoney(mission.totalAmountHt)}
                            </span>
                          </span>
                        </div>
                        <p className="text-center text-[10px] font-medium leading-tight text-violet-900 dark:text-violet-200">
                          {intervenantsLabel(
                            mission.totalIntervenantCount,
                            "mission",
                          )}
                        </p>
                      </div>
                      {mission.bcSummaries.length > 0 ? (
                        mission.bcSummaries.map((bc) => (
                          <div
                            key={`${bc.bcId}-jeh-amount`}
                            className="flex w-full max-w-[220px] flex-wrap items-center justify-center gap-x-2 gap-y-0.5 border border-slate-300/85 px-1 py-0.5 text-[10px] dark:border-white/8"
                          >
                            <span className="shrink-0 font-medium">
                              {bc.label}
                            </span>
                            <span className="shrink-0 tabular-nums text-violet-800 dark:text-violet-200">
                              {intervenantsLabel(bc.intervenantCount, "bc")}
                            </span>
                            <span className="tabular-nums text-sky-800 dark:text-sky-200">
                              {formatJeh(bc.totalJeh)} JEH
                            </span>
                            <span className="tabular-nums text-amber-900 dark:text-amber-200">
                              {formatMoney(bc.amountHt)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          —
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-center align-middle">
                    <div className="mx-auto flex max-w-[160px] flex-col items-center gap-1">
                      <span className="text-xs font-medium tabular-nums text-foreground">
                        {mission.endDate
                          ? new Intl.DateTimeFormat("fr-FR", {
                              dateStyle: "short",
                            }).format(new Date(mission.endDate))
                          : "—"}
                      </span>
                      {mission.endDate ? (
                        <>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-semibold",
                              deadline.isOverdue
                                ? "border-orange-400/85 bg-orange-100 text-orange-900 dark:border-orange-400/45 dark:bg-orange-500/20 dark:text-orange-100"
                                : "border-emerald-400/85 bg-emerald-100 text-emerald-900 dark:border-emerald-400/45 dark:bg-emerald-500/20 dark:text-emerald-100",
                            )}
                          >
                            {deadline.label}
                          </span>
                          {deadline.isOverdue ? (
                            <span
                              title="Modification à prévoir : avenant CCA"
                              className="inline-flex max-w-[150px] items-center justify-center gap-1 text-center text-[10px] leading-tight text-orange-700 dark:text-orange-300"
                            >
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>Avenant CCA à prévoir</span>
                            </span>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-center align-middle text-xs">
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(mission.updatedAt))}
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex justify-center">
                      <MissionFormDialog
                        options={options}
                        mission={mission}
                        canManageMissions={permissions.canManageBcStructure}
                        onSuccess={onRefresh}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })(),
          )}
          {missions.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground"
              >
                Aucune mission disponible.
              </TableCell>
            </TableRow>
          )}
          {missions.length > 0 && filteredMissions.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground"
              >
                Aucune mission ne correspond a la recherche.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {listGen && (
        <TemplateGenerationDialog
          key={`list-gen-${listGen.missionId}-${listGen.docType}-${listGen.bcId ?? "m"}`}
          open={true}
          onOpenChange={(open) => {
            if (!open) setListGen(null);
          }}
          missionId={listGen.missionId}
          bcId={listGen.bcId}
          documentType={listGen.docType}
          defaultNumber={`${listGen.docType}-${new Date().getFullYear()}`}
          canGenerate={permissions.canGenerateByDoc[listGen.docType]}
          onSuccess={() => {
            setListGen(null);
            onRefresh?.();
          }}
        />
      )}
      {listVal && (
        <TemplateValidationDialog
          key={`list-val-${listVal.missionId}-${listVal.docType}-${listVal.bcId ?? "m"}`}
          open={true}
          onOpenChange={(open) => {
            if (!open) setListVal(null);
          }}
          missionId={listVal.missionId}
          bcId={listVal.bcId}
          documentType={listVal.docType}
          canValidate={permissions.canValidateByDoc[listVal.docType]}
          onSuccess={() => {
            setListVal(null);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
