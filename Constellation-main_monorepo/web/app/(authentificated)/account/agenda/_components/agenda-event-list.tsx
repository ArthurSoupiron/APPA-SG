"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  AGENDA_AUDIENCE_LABELS,
  AGENDA_POLE_LABELS,
  AGENDA_STATUS_LABELS,
  formatAgendaAudienceGroup,
  formatAgendaEventRange,
} from "../_lib/agenda-pole-labels";
import type { AgendaEventListItem } from "../_lib/agenda-types";

export function AgendaEventList(props: {
  events: AgendaEventListItem[];
  onOpen: (id: string) => void;
}) {
  if (props.events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground whitespace-normal break-words">
        Aucun événement pour cette période.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {props.events.map((e) => (
        <li key={e.id}>
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full flex-col items-start gap-2 px-4 py-3 text-left"
            onClick={() => props.onOpen(e.id)}
          >
            <div className="flex w-full flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{e.reference}</span>
              <Badge variant="secondary">{AGENDA_POLE_LABELS[e.pole]}</Badge>
              <Badge
                variant="outline"
                style={e.typeColor ? { borderColor: e.typeColor, color: e.typeColor } : undefined}
              >
                {e.typeLabel}
              </Badge>
              <Badge variant="outline">{AGENDA_STATUS_LABELS[e.status]}</Badge>
            </div>
            <span className="text-base font-medium whitespace-normal break-words">{e.title}</span>
            <span className="text-sm text-muted-foreground whitespace-normal break-words">
              {formatAgendaEventRange(e.startsAt, e.endsAt, e.allDay, true)}
            </span>
            <span className="flex flex-wrap gap-1">
              {e.audienceGroups.map((g) => (
                <Badge key={g.id} variant="outline" className="text-xs">
                  {formatAgendaAudienceGroup(g)}
                </Badge>
              ))}
              {e.audiences.map((a) => (
                <Badge key={a} variant="outline" className="text-xs">
                  {AGENDA_AUDIENCE_LABELS[a]}
                </Badge>
              ))}
            </span>
          </Button>
        </li>
      ))}
    </ul>
  );
}
