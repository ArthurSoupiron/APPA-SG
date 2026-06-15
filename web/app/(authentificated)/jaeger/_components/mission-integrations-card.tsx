"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createMissionSlackChannel,
  debugSendMissionSlackGroupTagMessage,
  debugSendMissionSlackMessage,
  ensureMissionDriveLink,
  fetchMissionIntegrationState,
  linkMissionSlackChannel,
} from "../_lib/missions-api";
import type {
  GestionnaireMissionsPermissions,
  MissionIntegrationState,
} from "../_lib/missions-types";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";

type Props = {
  missionId: string;
  permissions: GestionnaireMissionsPermissions;
  onRefresh?: () => void;
};

const integrationStateCache = new Map<string, MissionIntegrationState>();

const selectTriggerCompact =
  "h-8 min-w-[10rem] max-w-[min(100%,14rem)] flex-1 rounded-none bg-slate-50/70 text-xs dark:bg-background/60";

export function MissionIntegrationsCard({ missionId, permissions, onRefresh }: Props) {
  const [state, setState] = useState<MissionIntegrationState | null>(
    () => integrationStateCache.get(missionId) ?? null,
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsCheckingStatus(true);
    startTransition(async () => {
      try {
        const data = await fetchMissionIntegrationState(missionId);
        if (!data) return;
        integrationStateCache.set(missionId, data);
        setState(data);
        setSelectedChannelId((prev) =>
          !prev && data.slack.channelId ? data.slack.channelId : prev,
        );
      } finally {
        setIsCheckingStatus(false);
      }
    });
  }, [missionId]);

  useEffect(() => {
    const cached = integrationStateCache.get(missionId);
    if (cached) {
      setState(cached);
      setSelectedChannelId((prev) =>
        !prev && cached.slack.channelId ? cached.slack.channelId : prev,
      );
      return;
    }
    setState(null);
    load();
  }, [missionId, load]);

  if (state === null) {
    return (
      <div className={cn(gm.cardSoft, "space-y-2 p-2.5")}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-36 animate-pulse rounded-sm bg-slate-200 dark:bg-white/10" />
          <div className="h-6 w-6 animate-pulse rounded-sm bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="space-y-2 border-b border-slate-300/70 pb-2 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-sm bg-slate-200 dark:bg-white/10" />
            <div className="h-3 w-20 animate-pulse rounded-sm bg-slate-200 dark:bg-white/10" />
            <div className="h-7 w-28 animate-pulse rounded-sm bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-sm bg-slate-200 dark:bg-white/10" />
            <div className="h-3 w-10 animate-pulse rounded-sm bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <div className="h-8 w-40 animate-pulse rounded-sm bg-slate-200 dark:bg-white/10" />
            <div className="h-7 w-28 animate-pulse rounded-sm bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  const getStatusClass = (linked: boolean, valid: boolean) =>
    !linked ? gm.statusGray : valid ? gm.statusGreen : gm.statusOrange;
  const isSlackOrange = state.slack.linked && !state.slack.valid;
  const isSlackGreen = state.slack.linked && state.slack.valid;
  const driveSquareClass = cn(
    gm.statusSquare,
    getStatusClass(state.drive.linked, state.drive.valid),
    isCheckingStatus && "animate-pulse",
  );
  const slackSquareClass = cn(
    gm.statusSquare,
    getStatusClass(state.slack.linked, state.slack.valid),
    isCheckingStatus && "animate-pulse",
  );

  return (
    <div className={cn(gm.cardSoft, "space-y-2 p-2.5")}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <div className="flex items-center gap-1">
          <h4 className="text-xs font-semibold sm:text-sm">
            Intégrations mission
          </h4>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
            title="Actualiser Drive / Slack"
            disabled={isCheckingStatus}
            onClick={() => load()}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isCheckingStatus && "animate-spin")}
            />
          </Button>
        </div>
        {isCheckingStatus && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Vérification...
          </span>
        )}
      </div>

      {!state.pluginsReady && (
        <p className="text-[11px] text-muted-foreground">
          Active les plugins `slack`, `google-drive` et `google-workspace` pour
          utiliser ce bloc.
        </p>
      )}

      {state.pluginsReady && (
        <>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-300/70 pb-2 dark:border-white/10">
            <span className={driveSquareClass} />
            <p className="text-[11px] font-medium text-muted-foreground">
              Google Drive
            </p>
            {state.drive.issue && (
              <p className="max-w-full text-[11px] text-orange-600 dark:text-orange-300">
                {state.drive.issue}
              </p>
            )}
            <Button
              size="sm"
              className={cn(gm.actionButton, "h-7 px-2 text-xs")}
              disabled={isPending || !permissions.canManageIntegrations}
              title={
                !permissions.canManageIntegrations
                  ? "Droits insuffisants pour lier ou réparer Drive."
                  : undefined
              }
              onClick={() =>
                startTransition(async () => {
                  try {
                    setError(null);
                    await ensureMissionDriveLink(missionId);
                    await load();
                    onRefresh?.();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Erreur Drive.");
                  }
                })
              }
            >
              {state.drive.issue === "Dossier Drive en corbeille."
                ? "Reparer dossier"
                : state.drive.linked
                  ? "Relier/Reparer dossier"
                  : "Créer/Lier dossier"}
            </Button>
            {state.drive.url && (
              <a
                href={state.drive.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] underline text-muted-foreground hover:text-foreground"
              >
                Ouvrir le dossier
              </a>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={slackSquareClass} />
              <p className="text-[11px] font-medium text-muted-foreground">
                Slack
              </p>
              {state.slack.issue && (
                <p className="max-w-full text-[11px] text-orange-600 dark:text-orange-300">
                  {state.slack.issue}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {!isSlackOrange && !isSlackGreen && (
                <>
                  <Select
                    value={selectedGroupId}
                    onValueChange={setSelectedGroupId}
                  >
                    <SelectTrigger className={selectTriggerCompact}>
                      <SelectValue placeholder="Groupe a inviter (obligatoire)" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.configuredSlackGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className={cn(gm.actionButton, "h-7 px-2 text-xs")}
                    disabled={
                      isPending ||
                      !permissions.canManageIntegrations ||
                      Boolean(state.slack.linked) ||
                      !selectedGroupId ||
                      state.configuredSlackGroups.length === 0
                    }
                    title={
                      !permissions.canManageIntegrations
                        ? "Droits insuffisants pour créer un canal Slack."
                        : undefined
                    }
                    onClick={() =>
                      startTransition(async () => {
                        try {
                          setError(null);
                          await createMissionSlackChannel(
                            missionId,
                            selectedGroupId,
                          );
                          await load();
                          onRefresh?.();
                        } catch (e) {
                          setError(
                            e instanceof Error ? e.message : "Erreur Slack.",
                          );
                        }
                      })
                    }
                  >
                    Créer un canal privé
                  </Button>
                </>
              )}
              <Select
                value={selectedChannelId}
                onValueChange={setSelectedChannelId}
              >
                <SelectTrigger className={selectTriggerCompact}>
                  <SelectValue placeholder="Lier un canal existant" />
                </SelectTrigger>
                <SelectContent>
                  {state.slackChannels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      #{ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className={cn(gm.actionButton, "h-7 px-2 text-xs")}
                disabled={
                  isPending ||
                  !permissions.canManageIntegrations ||
                  !selectedChannelId
                }
                title={
                  !permissions.canManageIntegrations
                    ? "Droits insuffisants pour lier un canal Slack."
                    : undefined
                }
                onClick={() =>
                  startTransition(async () => {
                    try {
                      setError(null);
                      await linkMissionSlackChannel(
                        missionId,
                        selectedChannelId,
                      );
                      await load();
                      onRefresh?.();
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : "Liaison Slack impossible.",
                      );
                    }
                  })
                }
              >
                Lier le canal
              </Button>
              {state.slack.url && (
                <a
                  href={state.slack.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] underline text-muted-foreground hover:text-foreground"
                >
                  Ouvrir le canal
                </a>
              )}
            </div>
            {permissions.canUseSlackDebug && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-300/50 pt-1.5 dark:border-white/8">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Debug
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(gm.actionButton, "h-7 px-2 text-xs")}
                  disabled={isPending || !state.slack.channelId}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        setError(null);
                        await debugSendMissionSlackMessage(missionId);
                        await load();
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "Debug Slack impossible.",
                        );
                      }
                    })
                  }
                >
                  Debug envoi texte
                </Button>
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                >
                  <SelectTrigger className={selectTriggerCompact}>
                    <SelectValue placeholder="Groupe pour test tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.configuredSlackGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(gm.actionButton, "h-7 px-2 text-xs")}
                  disabled={
                    isPending || !state.slack.channelId || !selectedGroupId
                  }
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        setError(null);
                        await debugSendMissionSlackGroupTagMessage(
                          missionId,
                          selectedGroupId,
                        );
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "Debug tag Slack impossible.",
                        );
                      }
                    })
                  }
                >
                  Debug tag groupe
                </Button>
              </div>
            )}
            {isSlackOrange && (
              <p className="text-[11px] text-muted-foreground">
                Creation masquee, utilise le relink vers un canal existant.
              </p>
            )}
            {!isSlackOrange && state.configuredSlackGroups.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                Aucun groupe configure: configure au moins un groupe dans
                l&apos;onglet Config avant de creer un canal.
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Groupes configures pour invitation auto:{" "}
              {state.configuredSlackGroups.length > 0
                ? state.configuredSlackGroups.map((g) => g.name).join(", ")
                : "aucun"}
            </p>
          </div>
        </>
      )}

      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
