import { SI_TICKET_STATUS_LABELS } from "../_lib/si-ticket-status";
import type { SiTicketDetail } from "../_lib/si-ticket-types";

function formatAt(iso: string) {
  return new Date(iso).toLocaleString("fr-FR");
}

export function SiTicketTimeline({ detail }: { detail: SiTicketDetail }) {
  const events: { at: string; label: string; body?: string }[] = [];

  for (const s of detail.statusLogs) {
    const from = s.fromStatus
      ? SI_TICKET_STATUS_LABELS[s.fromStatus as keyof typeof SI_TICKET_STATUS_LABELS] ?? s.fromStatus
      : null;
    const to =
      SI_TICKET_STATUS_LABELS[s.toStatus as keyof typeof SI_TICKET_STATUS_LABELS] ?? s.toStatus;
    const who = s.user?.name ?? s.user?.email ?? "Système";
    events.push({
      at: s.createdAt,
      label: from ? `${who} : ${from} → ${to}` : `${who} : ${to}`,
      body: s.comment ?? undefined,
    });
  }

  for (const c of detail.comments) {
    const who = c.user?.name ?? c.user?.email ?? "Utilisateur";
    events.push({
      at: c.createdAt,
      label: `Commentaire — ${who}`,
      body: c.body,
    });
  }

  events.sort((a, b) => a.at.localeCompare(b.at));

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun événement pour l’instant.</p>;
  }

  return (
    <ul className="space-y-3 border-l border-border pl-4">
      {events.map((e, i) => (
        <li key={`${e.at}-${i}`} className="relative">
          <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-border" />
          <p className="text-xs text-muted-foreground">{formatAt(e.at)}</p>
          <p className="text-sm font-medium whitespace-normal break-words">{e.label}</p>
          {e.body ? (
            <p className="mt-1 text-sm text-muted-foreground whitespace-normal break-words">{e.body}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
