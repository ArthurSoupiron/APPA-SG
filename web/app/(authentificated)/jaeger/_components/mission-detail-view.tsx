"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  GestionnaireMissionsPermissions,
  MissionRow,
} from "../_lib/missions-types";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";
import { MissionIntegrationsCard } from "./mission-integrations-card";

type MissionDetailViewProps = {
  mission: MissionRow;
  permissions: GestionnaireMissionsPermissions;
  onRefresh?: () => void;
};

export function MissionDetailView({ mission, permissions, onRefresh }: MissionDetailViewProps) {
  const [isRefreshingMission, startRefreshMission] = useTransition();
  const [nowTs, setNowTs] = useState<number | null>(null);

  useEffect(() => {
    queueMicrotask(() => setNowTs(Date.now()));
  }, []);

  const startTs = mission.startDate
    ? new Date(mission.startDate).getTime()
    : null;
  const endTs = mission.endDate ? new Date(mission.endDate).getTime() : null;
  const hasTimeline = startTs !== null && endTs !== null && endTs > startTs;
  const timelineProgress =
    hasTimeline && nowTs !== null
      ? Math.min(
          100,
          Math.max(0, ((nowTs - startTs) / (endTs - startTs)) * 100),
        )
      : null;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
      <div className="min-w-0 w-full lg:max-w-md lg:shrink-0">
        <MissionIntegrationsCard
          missionId={mission.id}
          permissions={permissions}
          onRefresh={onRefresh}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className={gm.sectionContainer}>
          <div className={gm.sectionHeader}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold">Détails</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
                  title="Actualiser les données mission (liste)"
                  disabled={isRefreshingMission}
                  onClick={() =>
                    startRefreshMission(() => {
                      onRefresh?.();
                    })
                  }
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5",
                      isRefreshingMission && "animate-spin",
                    )}
                  />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Informations de la mission. Génération et validation des
                documents : onglet{" "}
                <span className="font-medium text-foreground">Workflow</span> ;
                matrice B | D : liste des missions et workflow.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 p-3 sm:gap-3 sm:p-4 xl:grid-cols-2">
            <div className="xl:col-span-2">
              <div className="rounded-sm border border-slate-300/85 px-2 py-2 dark:border-white/8">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Avancement temporel
                  </p>
                  <p className="text-xs font-medium tabular-nums">
                    {timelineProgress === null
                      ? "N/A"
                      : `${Math.round(timelineProgress)}%`}
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/12">
                  <div
                    className="h-full bg-amber-500 transition-[width] duration-300 dark:bg-amber-400"
                    style={{ width: `${timelineProgress ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="xl:col-span-2">
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">
                {mission.description || "Aucune description."}
              </p>
            </div>

            <div className="xl:col-span-2 mt-1 border-t border-slate-300/85 pt-3 dark:border-white/8">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Informations client
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nom</p>
              <p className="text-sm font-medium">{mission.clientNom ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prénom</p>
              <p className="text-sm font-medium">
                {mission.clientPrenom ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium break-all">
                {mission.clientMail ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Téléphone</p>
              <p className="text-sm font-medium">
                {mission.clientTelephone ?? "-"}
              </p>
            </div>

            <div className="xl:col-span-2 mt-1 border-t border-slate-300/85 pt-3 dark:border-white/8">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Informations entreprise
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nom entreprise</p>
              <p className="text-sm font-medium">
                {mission.entrepriseName ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SIREN</p>
              <p className="text-sm font-medium">
                {mission.entrepriseSiren ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email entreprise</p>
              <p className="text-sm font-medium break-all">
                {mission.entrepriseMail ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Téléphone entreprise
              </p>
              <p className="text-sm font-medium">
                {mission.entrepriseTelephone ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ville</p>
              <p className="text-sm font-medium">
                {mission.entrepriseVille ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Code postal</p>
              <p className="text-sm font-medium">
                {mission.entrepriseCodePostal ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pays</p>
              <p className="text-sm font-medium">
                {mission.entreprisePays ?? "-"}
              </p>
            </div>
            <div className="xl:col-span-2">
              <p className="text-xs text-muted-foreground">Adresse</p>
              <p className="text-sm font-medium">
                {mission.entrepriseAdresse ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
