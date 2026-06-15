"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type {
  BddMatrixStatus,
  BonCommandeType,
  DocMatrixCell,
  DriveMatrixStatus,
  GestionnaireMissionsPermissions,
} from "../_lib/missions-types";
import {
  buildMatrixBlockPanel,
  type MatrixDocumentStepAction,
} from "../_lib/matrix-doc-click";

export type { MatrixDocumentStepAction } from "../_lib/matrix-doc-click";
import { docMatrixStyles as dm } from "../_lib/doc-matrix.styles";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";

export function bddStatusClass(status: BddMatrixStatus): string {
  if (status === "pending_drive") return gm.bddPendingDrive;
  if (status === "synced") return gm.bddSynced;
  if (status === "inconsistency") return gm.bddInconsistency;
  if (status === "error") return gm.bddError;
  return gm.bddAbsent;
}

export function driveStatusClass(status: DriveMatrixStatus): string {
  if (status === "present") return gm.drivePresent;
  if (status === "trashed") return gm.driveTrashed;
  if (status === "inconsistency") return gm.driveInconsistency;
  return gm.driveAbsent;
}

function bddLabelFr(status: BddMatrixStatus): string {
  if (status === "pending_drive") return "En attente génération";
  if (status === "synced") return "Synchronisé";
  if (status === "inconsistency") return "Incohérence";
  if (status === "error") return "Erreur";
  return "Absent";
}

function driveLabelFr(status: DriveMatrixStatus): string {
  if (status === "present") return "Présent";
  if (status === "trashed") return "Corbeille / id à remplacer";
  if (status === "inconsistency") return "Incohérence";
  return "Absent";
}

function DocMatrixBdSplitMini({
  cell,
  loading,
}: {
  cell: DocMatrixCell | undefined;
  loading: boolean;
}) {
  return (
    <span
      className={cn(
        gm.statusSquareSplit,
        dm.pill.bdSplitShell,
        loading && dm.pill.loadingPulse,
      )}
    >
      <span
        className={cn(
          dm.pill.bdSplitSegment,
          loading ? gm.bddAbsent : bddStatusClass(cell?.bdd ?? "absent"),
        )}
      >
        B
      </span>
      <span
        className={cn(
          dm.pill.bdSplitSegment,
          loading ? gm.driveAbsent : driveStatusClass(cell?.drive ?? "absent"),
        )}
      >
        D
      </span>
    </span>
  );
}

/** Propale / CDC : pas de BDD, pastille Drive seule. */
function DocMatrixDriveOnlyMini({
  cell,
  loading,
}: {
  cell: DocMatrixCell | undefined;
  loading: boolean;
}) {
  return (
    <span
      className={cn(
        gm.statusSquareSplit,
        dm.pill.driveOnlyShell,
        loading && dm.pill.loadingPulse,
      )}
    >
      <span
        className={cn(
          dm.pill.driveOnlySegment,
          loading ? gm.driveAbsent : driveStatusClass(cell?.drive ?? "absent"),
        )}
      >
        D
      </span>
    </span>
  );
}

/** PDF prêt à envoyer : BDD synchronisée + Drive présent ; Propale/CDC (driveOnly) : Drive présent seul. */
function isPdfReadyToSend(
  pdfCell: DocMatrixCell | undefined,
  driveOnly: boolean,
): boolean {
  if (!pdfCell) return false;
  if (driveOnly) return pdfCell.drive === "present";
  return pdfCell.bdd === "synced" && pdfCell.drive === "present";
}

/**
 * DX : pastille B | D ; PDF : pastille D seule (réf. BDD portée par la ligne DOCX).
 * - `default` : libellé à gauche, DX puis PDF empilés (détail / workflow).
 * - `compact` : libellé au-dessus, DX puis PDF empilés (liste missions : moins de largeur par bloc).
 */
export function DocMatrixUnifiedPill({
  groupLabel,
  docxCell,
  pdfCell,
  loading,
  showDocx = true,
  variant = "default",
  driveOnly = false,
  matrixPanel,
  onMatrixStep,
}: {
  groupLabel: string;
  docxCell?: DocMatrixCell;
  pdfCell?: DocMatrixCell;
  loading: boolean;
  /** Propale / CDC : PDF seul */
  showDocx?: boolean;
  variant?: "default" | "compact";
  /** Propale / CDC : statut Drive uniquement (pas de B | D). */
  driveOnly?: boolean;
  /** Contexte permissions + BC (pour BC/BCR et RMI/ARMI). */
  matrixPanel?: {
    permissions: GestionnaireMissionsPermissions;
    bcKind?: BonCommandeType;
    rmiTemplate?: "RMI" | "ARMI";
  };
  /** Clic sur le bloc entier : panneau récap + boutons d’étapes. */
  onMatrixStep?: (action: MatrixDocumentStepAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const showActionsPopover =
    Boolean(matrixPanel) && Boolean(onMatrixStep) && !loading;

  const panel = useMemo(
    () =>
      showActionsPopover && matrixPanel
        ? buildMatrixBlockPanel({
            groupLabel,
            docxCell,
            pdfCell,
            showDocx,
            driveOnly,
            permissions: matrixPanel.permissions,
            bcKind: matrixPanel.bcKind,
            rmiTemplate: matrixPanel.rmiTemplate,
          })
        : null,
    [
      showActionsPopover,
      groupLabel,
      docxCell,
      pdfCell,
      showDocx,
      driveOnly,
      matrixPanel,
    ],
  );

  const pdfReady = !loading && isPdfReadyToSend(pdfCell, driveOnly);
  const title = loading
    ? "Chargement…"
    : driveOnly
      ? [
          `PDF — Drive: ${driveLabelFr(pdfCell?.drive ?? "absent")}${pdfCell?.issueDrive ? ` — ${pdfCell.issueDrive}` : ""}`,
          pdfReady ? "PDF présent dans le dossier mission (Drive)." : "",
          showActionsPopover ? "Cliquer sur le bloc : récapitulatif." : "",
        ]
          .filter((s) => s.length > 0)
          .join("\n")
      : [
          showDocx
            ? [
                `DX — BDD: ${bddLabelFr(docxCell?.bdd ?? "absent")}${docxCell?.issueBdd ? ` — ${docxCell.issueBdd}` : ""}`,
                `DX — Drive: ${driveLabelFr(docxCell?.drive ?? "absent")}${docxCell?.issueDrive ? ` — ${docxCell.issueDrive}` : ""}`,
              ].join("\n")
            : "",
          `PDF — Drive: ${driveLabelFr(pdfCell?.drive ?? "absent")}${pdfCell?.issueDrive ? ` — ${pdfCell.issueDrive}` : ""}`,
          showDocx
            ? "(Réf. BDD : voir ligne DOCX — pas de pastille B sur le PDF.)"
            : "",
          pdfReady ? "PDF prêt à envoyer (réf. BDD + fichier Drive)." : "",
          showActionsPopover
            ? "Cliquer sur le bloc : récapitulatif et étapes possibles."
            : "",
        ]
          .filter((s) => s.length > 0)
          .join("\n");

  const pdfBlock = (
    <span className={cn(dm.pill.pdfRow, pdfReady && dm.pill.pdfRowReady)}>
      <span className={dm.pill.pdfLabel}>PDF</span>
      <DocMatrixDriveOnlyMini cell={pdfCell} loading={loading} />
      {pdfReady ? (
        <span
          className={dm.pill.pdfCheck}
          title={driveOnly ? "PDF présent sur Drive" : "PDF prêt à envoyer"}
        >
          ✓
        </span>
      ) : null}
    </span>
  );

  const dxBlock = showDocx ? (
    <span className={dm.pill.dxRow}>
      <span className={dm.pill.dxLabel}>DX</span>
      <DocMatrixBdSplitMini cell={docxCell} loading={loading} />
    </span>
  ) : null;

  const innerPills = (
    <span
      className={cn(dm.pill.innerStack, loading && dm.pill.loadingPulseStack)}
    >
      {dxBlock}
      {pdfBlock}
    </span>
  );

  const triggerClass = cn(
    dm.pill.trigger,
    showActionsPopover && dm.pill.triggerInteractive,
  );

  const blockCompact = (
    <span className={dm.pill.blockCompactOuter}>
      <span className={dm.pill.groupLabelCompact}>{groupLabel}</span>
      {innerPills}
    </span>
  );

  const blockDefault = (
    <span className={dm.pill.blockDefaultOuter}>
      <span className={dm.pill.groupLabelDefault}>{groupLabel}</span>
      {innerPills}
    </span>
  );

  const blockBody = variant === "compact" ? blockCompact : blockDefault;

  if (panel && onMatrixStep) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={triggerClass} title={title}>
            {blockBody}
          </button>
        </PopoverTrigger>
        <PopoverContent className={dm.popover.content} align="start">
          <p className={dm.popover.title}>{panel.title}</p>
          {panel.steps.length > 0 ? (
            <div className={dm.popover.stepsSection}>
              <p className={dm.popover.stepsTitle}>Étapes proposées</p>
              <div className={dm.popover.stepsStack}>
                {panel.steps.map((step) => (
                  <div key={step.id} className={dm.popover.stepRow}>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn(gm.actionButton, dm.popover.stepButton)}
                      onClick={() => {
                        onMatrixStep(step.action);
                        setOpen(false);
                      }}
                    >
                      {step.label}
                    </Button>
                    {step.description ? (
                      <p className={dm.popover.stepDescription}>
                        {step.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {panel.footerNote ? (
            <p className={dm.popover.footer}>{panel.footerNote}</p>
          ) : null}
        </PopoverContent>
      </Popover>
    );
  }

  if (variant === "compact") {
    return (
      <span className={dm.pill.blockCompactOuter} title={title}>
        <span className={dm.pill.groupLabelCompact}>{groupLabel}</span>
        {innerPills}
      </span>
    );
  }

  return (
    <span className={dm.pill.blockDefaultOuter} title={title}>
      <span className={dm.pill.groupLabelDefault}>{groupLabel}</span>
      {innerPills}
    </span>
  );
}

export function DocMatrixSplitPill({
  pillLabel,
  cell,
  loading,
}: {
  /** Ex. DX ou PDF */
  pillLabel: string;
  cell: DocMatrixCell | undefined;
  loading: boolean;
}) {
  const title = loading
    ? "Chargement…"
    : [
        `${pillLabel} — BDD: ${bddLabelFr(cell?.bdd ?? "absent")}${cell?.issueBdd ? ` — ${cell.issueBdd}` : ""}`,
        `${pillLabel} — Drive: ${driveLabelFr(cell?.drive ?? "absent")}${cell?.issueDrive ? ` — ${cell.issueDrive}` : ""}`,
      ].join("\n");

  return (
    <span className={dm.splitPill.row} title={title}>
      <span className={dm.splitPill.label}>{pillLabel}</span>
      <span
        className={cn(
          gm.statusSquareSplit,
          dm.splitPill.shell,
          loading && dm.pill.loadingPulse,
        )}
      >
        <span
          className={cn(
            dm.splitPill.segment,
            loading ? gm.bddAbsent : bddStatusClass(cell?.bdd ?? "absent"),
          )}
        >
          B
        </span>
        <span
          className={cn(
            dm.splitPill.segment,
            loading
              ? gm.driveAbsent
              : driveStatusClass(cell?.drive ?? "absent"),
          )}
        >
          D
        </span>
      </span>
    </span>
  );
}

/** Légende compacte pour une section (Détails mission, liste, workflow). */
export function DocMatrixLegend({ className }: { className?: string }) {
  return (
    <div className={cn(dm.legend.container, className)}>
      <p className={dm.legend.title}>Lecture des pastilles (B | D)</p>
      <p className={dm.legend.intro}>
        Par document : <span className={dm.legend.emphasisDx}>DX</span> avec
        pastille <span className={dm.legend.emphasisStrong}>B | D</span> ;{" "}
        <span className={dm.legend.emphasisPdf}>PDF</span> avec pastille{" "}
        <span className={dm.legend.emphasisStrong}>D</span> seule (pas de B sur
        le PDF : pas d’action BDD→PDF directe ; la validation crée le PDF sur
        Drive puis met à jour le même{" "}
        <code className={dm.legend.code}>generated_file_id</code>). Propale et
        CDC : PDF en <span className={dm.legend.emphasisStrong}>D</span> seul.
        En liste missions, le nom du document (BC, FA, …) est au-dessus ; DX et
        PDF sont empilés pour gagner en largeur. La partie PDF est surlignée en
        vert avec un ✓ lorsque le PDF est{" "}
        <span className={dm.legend.emphasisReady}>prêt à envoyer</span> (CCA /
        BC : BDD synchronisée + fichier sur Drive ; Propale / CDC : PDF présent
        sur Drive). Un{" "}
        <span className={dm.legend.emphasisStrong}>clic sur tout le bloc</span>{" "}
        (libellé + pastilles) ouvre un récap des états BDD / Drive et les{" "}
        <span className={dm.legend.emphasisStrong}>étapes possibles</span>{" "}
        (génération Word, validation PDF) pour CCA, BC/BCR, RMI/ARMI et PVRF.
      </p>
      <div className={dm.legend.grid}>
        <div>
          <p className={dm.legend.columnTitle}>B — Base de données</p>
          <ul className={dm.legend.list}>
            <li>
              <span className={cn(dm.legend.sampleSwatch, gm.bddAbsent)} />{" "}
              Absent : pas d&apos;entité métier (ex. pas de FA / RMI).
            </li>
            <li>
              <span
                className={cn(dm.legend.sampleSwatch, gm.bddPendingDrive)}
              />{" "}
              En attente génération : entité présente mais pas encore de fichier
              généré référencé (
              <code className={dm.legend.code}>generated_file_id</code>).
            </li>
            <li>
              <span className={cn(dm.legend.sampleSwatch, gm.bddSynced)} />{" "}
              Synchronisé : référence fichier en base (généré sur Drive).
            </li>
            <li>
              <span
                className={cn(dm.legend.sampleSwatch, gm.bddInconsistency)}
              />{" "}
              Incohérence : chaîne d&apos;avenants, lignes FS/BV incomplètes,
              etc.
            </li>
            <li>
              <span className={cn(dm.legend.sampleSwatch, gm.bddError)} />{" "}
              Erreur : cas rare côté données.
            </li>
          </ul>
        </div>
        <div>
          <p className={dm.legend.columnTitle}>D — Google Drive</p>
          <ul className={dm.legend.list}>
            <li>
              <span className={cn(dm.legend.sampleSwatch, gm.driveAbsent)} />{" "}
              Absent : pas de fichier correspondant au préfixe (colonne DX = pas
              de DOCX attendu, colonne PDF = pas de PDF attendu).
            </li>
            <li>
              <span className={cn(dm.legend.sampleSwatch, gm.drivePresent)} />{" "}
              Présent : fichier attendu trouvé dans le dossier (ou PDF validé
              via la référence BDD).
            </li>
            <li>
              <span className={cn(dm.legend.sampleSwatch, gm.driveTrashed)} />{" "}
              Corbeille / id à remplacer : l&apos;id en BDD pointe vers un
              fichier introuvable ou en corbeille.
            </li>
            <li>
              <span
                className={cn(dm.legend.sampleSwatch, gm.driveInconsistency)}
              />{" "}
              Incohérence Drive : ex. DOCX résiduel alors que le PDF est déjà
              présent.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
