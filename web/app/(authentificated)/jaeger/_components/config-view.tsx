"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { GestionnaireMissionsPermissions, SlackGroupOption } from "../_lib/missions-types";
import {
  syncMissionTemplates,
  updateSlackGroupConfig,
} from "../_lib/missions-api";
import type { ListDriveMissionTemplatesResult } from "../_lib/missions-types";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";

type Props = {
  groups: SlackGroupOption[];
  permissions: GestionnaireMissionsPermissions;
  activeSection: "slack" | "template" | "permissions";
  onRefresh?: () => void;
};

export function ConfigView({ groups, permissions, activeSection, onRefresh }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isRefreshingPage, startRefreshPage] = useTransition();
  const canViewDriveTemplates =
    permissions.canSyncTemplates || permissions.canManagePermissions;
  const [templateScan, setTemplateScan] =
    useState<ListDriveMissionTemplatesResult | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const loadDriveTemplates = () => {
    if (!canViewDriveTemplates) return;
    setTemplateLoading(true);
    setTemplateError(null);
    syncMissionTemplates()
      .then((res) => {
        setTemplateScan(res);
        if (!res?.ok) setTemplateError(res?.error ?? "Chargement impossible.");
        else setTemplateError(null);
      })
      .catch((e) =>
        setTemplateError(
          e instanceof Error ? e.message : "Chargement impossible.",
        ),
      )
      .finally(() => setTemplateLoading(false));
  };

  const initialSelected = useMemo(
    () => groups.filter((g) => g.selected).map((g) => g.id),
    [groups],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);
  const [error, setError] = useState<string | null>(null);

  const permissionItems = [
    { label: "Generer templates", value: permissions.canGenerateTemplates },
    { label: "Valider documents", value: permissions.canValidateDocuments },
    {
      label: "Structure mission / BC / docs",
      value: permissions.canManageBcStructure,
    },
    {
      label: "Integrations Drive / Slack",
      value: permissions.canManageIntegrations,
    },
    { label: "Config groupes Slack", value: permissions.canManageSlackGroups },
    { label: "Sync templates Drive", value: permissions.canSyncTemplates },
    {
      label: "Apercu permissions (config)",
      value: permissions.canManagePermissions,
    },
  ];

  return (
    <div className="space-y-3">
      {activeSection === "slack" && (
        <div className={gm.sectionContainer}>
          <div className={gm.sectionHeader}>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold">Configuration Slack</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
                  title="Recharger la page (groupes depuis le serveur)"
                  disabled={isRefreshingPage}
                  onClick={() =>
                    startRefreshPage(() => {
                      onRefresh?.();
                    })
                  }
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5",
                      isRefreshingPage && "animate-spin",
                    )}
                  />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Choisis les user groups Slack (@ao, @groupe_nda, …) à inviter
                automatiquement dans les canaux mission (créés en privé). Lance
                une synchro admin si le cache est vide.
              </p>
            </div>
          </div>
          <div className="space-y-2 p-2.5">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-5">
              {groups.length === 0 && (
                <p className="col-span-full text-xs text-muted-foreground">
                  Aucun user group Slack en cache. Lance{" "}
                  <code className="text-[11px]">POST /api/app/admin/slack/user-groups/sync</code>{" "}
                  (super-admin) ou le seed avec token Slack configuré.
                </p>
              )}
              {groups.map((group) => {
                const checked = selectedIds.includes(group.id);
                const checkId = `mission-slack-gc-${group.id}`;
                return (
                  <label
                    key={group.id}
                    htmlFor={checkId}
                    className="flex items-center gap-2 border border-slate-300/85 bg-slate-50/70 p-1.5 dark:border-white/8 dark:bg-background/65"
                  >
                    <Checkbox
                      id={checkId}
                      checked={checked}
                      className="mt-0.5 rounded-none"
                      disabled={
                        group.isDisabled ||
                        isPending ||
                        !permissions.canManageSlackGroups
                      }
                      onCheckedChange={(value) => {
                        const enabled = value === true;
                        setSelectedIds((prev) =>
                          enabled
                            ? Array.from(new Set([...prev, group.id]))
                            : prev.filter((id) => id !== group.id),
                        );
                      }}
                    />
                    <span className="min-w-0 flex-1 whitespace-normal wrap-anywhere">
                      <span className="block text-xs font-medium leading-snug">
                        {group.name}
                      </span>
                      <span className="block text-[11px] italic text-muted-foreground">
                        @{group.handle || group.id}
                      </span>
                    </span>
                    {group.isDisabled && (
                      <Badge
                        variant="secondary"
                        className="h-5 rounded-none px-1.5 text-[10px]"
                      >
                        desactive
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-300/85 pt-2 dark:border-white/8">
              <Button
                size="sm"
                className={`${gm.actionButton} h-7 px-2 text-xs`}
                disabled={isPending || !permissions.canManageSlackGroups}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      setError(null);
                      await updateSlackGroupConfig(selectedIds);
                      onRefresh?.();
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : "Sauvegarde impossible.",
                      );
                    }
                  })
                }
              >
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
            {!permissions.canManageSlackGroups && (
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Permissions insuffisantes pour modifier les groupes Slack.
              </p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>
      )}

      {activeSection === "template" && (
        <div className={gm.sectionContainer}>
          <div className={gm.sectionHeader}>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold">Templates Drive (DOCX / Google Doc)</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
                  title="Synchroniser les modèles Drive et les balises en base"
                  disabled={templateLoading || !canViewDriveTemplates}
                  onClick={() => loadDriveTemplates()}
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5",
                      templateLoading && "animate-spin",
                    )}
                  />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Fichiers DOCX ou Google Docs dans le dossier{" "}
                <code className="text-[11px]">Template</code> sous la racine
                missions (
                <code className="text-[11px]">DRIVE_MISSIONS_ROOT_ID</code>).
                Chaque chargement exporte/analyse les modèles (appels Google) et
                enregistre les balises en base locale par type (noms attendus :{" "}
                <code className="text-[11px]">template_cca</code>,{" "}
                <code className="text-[11px]">template_bc</code>,{" "}
                <code className="text-[11px]">template_bcr</code>,{" "}
                <code className="text-[11px]">template_rmi</code>,{" "}
                <code className="text-[11px]">template_armi</code>,{" "}
                <code className="text-[11px]">template_pvrf</code>) pour la
                génération de documents. Balises détectées :{" "}
                <code className="text-[11px]">&lt;&lt;…&gt;&gt;</code> et{" "}
                <code className="text-[11px]">{"{{…}}"}</code>.
              </p>
            </div>
          </div>
          <div className="space-y-2 p-2.5">
            {!canViewDriveTemplates && (
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Permissions insuffisantes (génération de templates ou admin
                plugin requis).
              </p>
            )}
            {canViewDriveTemplates && templateError && (
              <p className="text-xs text-red-500">{templateError}</p>
            )}
            {canViewDriveTemplates && !templateScan && !templateLoading && (
              <p className="text-xs text-muted-foreground">
                L&apos;analyse Drive est lourde : lancez un chargement pour
                mettre à jour la base des balises (nécessaire avant
                d&apos;ouvrir un dialog de génération de document).
              </p>
            )}
            {canViewDriveTemplates &&
              templateScan?.ok &&
              templateScan.folderUrl && (
                <p className="text-[11px] text-muted-foreground">
                  Dossier :{" "}
                  <a
                    href={templateScan.folderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-amber-700 underline underline-offset-2 dark:text-amber-300"
                  >
                    ouvrir sur Drive
                  </a>
                </p>
              )}
            {canViewDriveTemplates &&
              templateScan?.ok &&
              templateScan.items.length === 0 &&
              !templateLoading && (
                <p className="text-xs text-muted-foreground">
                  Aucun fichier DOCX ou Google Doc dans ce dossier.
                </p>
              )}
            {canViewDriveTemplates &&
              templateScan?.ok &&
              templateScan.items.map((item) => (
                <div
                  key={item.id}
                  className="space-y-1.5 border border-slate-300/85 p-2 dark:border-white/8"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 text-xs font-medium whitespace-normal wrap-anywhere">
                      {item.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="h-5 shrink-0 rounded-none px-1.5 text-[10px]"
                    >
                      {item.kind === "google_doc" ? "Google Doc" : "DOCX"}
                    </Badge>
                    <a
                      href={item.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[11px] text-amber-700 underline underline-offset-2 dark:text-amber-300"
                    >
                      Fichier
                    </a>
                  </div>
                  {item.error && (
                    <p className="text-[11px] text-red-500">{item.error}</p>
                  )}
                  {!item.error && item.tags.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Aucune balise détectée.
                    </p>
                  )}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <code
                          key={tag}
                          className="rounded-none border border-slate-300/80 bg-slate-50/80 px-1 py-0.5 text-[10px] dark:border-white/10 dark:bg-background/60"
                        >
                          {tag}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {activeSection === "permissions" && (
        <div className={gm.sectionContainer}>
          <div className={gm.sectionHeader}>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold">
                  Permissions Gestionnaire
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
                  title="Recharger la page (permissions depuis le serveur)"
                  disabled={isRefreshingPage}
                  onClick={() =>
                    startRefreshPage(() => {
                      onRefresh?.();
                    })
                  }
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5",
                      isRefreshingPage && "animate-spin",
                    )}
                  />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Capacites actives pour votre compte dans ce plugin.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1.5 p-2.5 md:grid-cols-2">
            {permissionItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2 border border-slate-300/85 px-2 py-1.5 text-xs dark:border-white/8"
              >
                <span className="whitespace-normal wrap-anywhere">{item.label}</span>
                <Badge
                  variant={item.value ? "default" : "secondary"}
                  className="h-5 rounded-none px-1.5 text-[10px]"
                >
                  {item.value ? "Oui" : "Non"}
                </Badge>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 border-t border-slate-300/85 p-2.5 dark:border-white/8">
            <p className="text-[11px] text-muted-foreground">
              Droits gérés exclusivement via UBAC (catalogue ERP). Attribuez les
              permissions aux groupes Google Workspace dans Administration → UBAC.
            </p>
            <div className="border border-slate-300/85 p-1.5 text-[11px] dark:border-white/8">
              <p className="font-medium">Permissions ERP (catalogue UBAC)</p>
              <ul className="mt-1 grid grid-cols-1 gap-1 md:grid-cols-2">
                <li>
                  <code>erp.read</code> — consultation missions, workflow, journal, KPI
                </li>
                <li>
                  <code>erp.mission.manage</code> — CRUD mission, BC, documents métier,
                  clients/entreprises
                </li>
                <li>
                  <code>erp.integration.manage</code> — Drive et Slack par mission
                </li>
                <li>
                  <code>erp.slack.manage</code> — configuration globale groupes Slack
                </li>
                <li>
                  <code>erp.config.read</code> — aperçu des droits (cet onglet)
                </li>
                <li>
                  <code>erp.templates.sync</code> — synchronisation registre templates
                </li>
                <li>
                  <code>erp.doc.generate.*</code> — génération par type (cca, bc, bcr, rmi,
                  armi, pvrf)
                </li>
                <li>
                  <code>erp.doc.validate.*</code> — validation PDF par type
                </li>
                <li>
                  <code>erp.delete</code> — suppressions
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
