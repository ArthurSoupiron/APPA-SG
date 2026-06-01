export type AgendaPole =
  | "crm"
  | "marketing"
  | "rh"
  | "tresorerie"
  | "si"
  | "operations"
  | "presidence"
  | "erp"
  | "academy"
  | "rfp";

export type AgendaAudience = "mandat" | "intervenants" | "externes";

export type AgendaAudienceGroup = {
  id: string;
  email: string;
  name: string | null;
};

export type AgendaWorkspaceGroupOption = AgendaAudienceGroup;

export type AgendaEventStatus = "draft" | "published" | "cancelled";

export type AgendaRsvpStatus = "pending" | "accepted" | "declined" | "tentative";

export type AgendaEventTypeRow = {
  id: string;
  pole: AgendaPole;
  slug: string;
  label: string;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type AgendaEventListItem = {
  id: string;
  reference: string;
  pole: AgendaPole;
  typeId: string;
  typeLabel: string;
  typeColor: string | null;
  title: string;
  description: string;
  status: AgendaEventStatus;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  timezone: string | null;
  location: string | null;
  meetUrl: string | null;
  driveUrl: string | null;
  recurrenceRule: string | null;
  recurrenceParentId: string | null;
  audiences: AgendaAudience[];
  audienceGroups: AgendaAudienceGroup[];
  source: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AgendaUser = {
  id: string;
  name: string | null;
  email: string | null;
};

export type AgendaEventDetail = AgendaEventListItem & {
  createdBy: AgendaUser | null;
  updatedBy: AgendaUser | null;
  participants: {
    id: string;
    userId: string | null;
    email: string;
    displayName: string | null;
    rsvpStatus: AgendaRsvpStatus;
    role: string;
    fromAudienceGroup?: boolean;
    sourceGroupName?: string | null;
  }[];
  comments: {
    id: string;
    body: string;
    createdAt: string;
    user: AgendaUser | null;
  }[];
  myParticipant: { id: string; rsvpStatus: AgendaRsvpStatus } | null;
  canEdit: boolean;
  canDelete: boolean;
};

export type AgendaNotification = {
  id: string;
  eventId: string;
  kind: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};
