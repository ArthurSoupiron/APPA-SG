"use client";

import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { MissionEventWithActor } from "../_lib/missions-types";
import { fetchMissionEvents } from "../_lib/missions-api";
import { gestionnaireMissionsStyles as gm } from "../_lib/gestionnaire-missions.styles";

type Props = {
  missionId: string;
};

export function MissionJournalView({ missionId }: Props) {
  const [events, setEvents] = useState<MissionEventWithActor[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const rows = await fetchMissionEvents(missionId);
      setEvents(rows);
    });
  }, [missionId]);

  return (
    <div className={cn(gm.sectionContainer, "h-full min-h-0 overflow-hidden")}>
      <div className={cn(gm.sectionHeader)}>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Journals mission</h4>
        </div>
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        )}
      </div>
      <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-xs text-muted-foreground">
            <ClipboardList className="h-6 w-6 opacity-30" />
            <p>Aucun événement pour cette mission.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-300/85 dark:divide-white/8">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 px-3 py-2">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                  {event.eventType.endsWith("_avenant") ? (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  ) : event.eventType.endsWith("_created") ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs">{event.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Par{" "}
                    {event.actorName ??
                      event.actorEmail ??
                      "Utilisateur inconnu"}
                  </p>
                  {event.revisionNumber && event.revisionNumber > 1 && (
                    <p className="text-[10px] text-muted-foreground">
                      Révision #{event.revisionNumber}
                    </p>
                  )}
                </div>
                <time className="shrink-0 text-[10px] text-muted-foreground">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(event.changedAt))}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
