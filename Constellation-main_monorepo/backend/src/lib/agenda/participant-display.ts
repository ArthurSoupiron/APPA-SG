import type { AgendaRsvpStatus } from "../../db/schema/agenda/poles";
import type { ExpandedAudienceMember } from "./expand-audience-group-members";
import type { AudienceGroupSummary } from "./event-serialize";

type DbParticipant = {
  id: string;
  userId: string | null;
  email: string;
  displayName: string | null;
  rsvpStatus: AgendaRsvpStatus;
  role: string;
};

export type AgendaParticipantView = {
  id: string;
  userId: string | null;
  email: string;
  displayName: string | null;
  rsvpStatus: AgendaRsvpStatus;
  role: string;
  fromAudienceGroup: boolean;
  sourceGroupName: string | null;
};

export function buildParticipantViews(
  dbParticipants: DbParticipant[],
  audienceGroups: AudienceGroupSummary[],
  expandedMembers: ExpandedAudienceMember[],
): AgendaParticipantView[] {
  const groupEmails = new Set(audienceGroups.map((g) => g.email.trim().toLowerCase()));
  const expandedByEmail = new Map(expandedMembers.map((m) => [m.email, m]));
  const byEmail = new Map<string, AgendaParticipantView>();

  for (const p of dbParticipants) {
    const email = p.email.trim().toLowerCase();
    if (groupEmails.has(email)) continue;

    const expanded = expandedByEmail.get(email);
    byEmail.set(email, {
      id: p.id,
      userId: p.userId,
      email,
      displayName: p.displayName,
      rsvpStatus: p.rsvpStatus,
      role: p.role,
      fromAudienceGroup: Boolean(expanded),
      sourceGroupName: expanded?.sourceGroupName ?? null,
    });
  }

  for (const m of expandedMembers) {
    if (byEmail.has(m.email)) continue;
    byEmail.set(m.email, {
      id: `audience:${m.email}`,
      userId: m.userId,
      email: m.email,
      displayName: m.displayName,
      rsvpStatus: "pending",
      role: "attendee",
      fromAudienceGroup: true,
      sourceGroupName: m.sourceGroupName,
    });
  }

  const list = [...byEmail.values()];
  list.sort((a, b) => {
    if (a.role === "organizer" && b.role !== "organizer") return -1;
    if (b.role === "organizer" && a.role !== "organizer") return 1;
    const la = (a.displayName ?? a.email).toLocaleLowerCase("fr");
    const lb = (b.displayName ?? b.email).toLocaleLowerCase("fr");
    return la.localeCompare(lb, "fr");
  });
  return list;
}
