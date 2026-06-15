export type SiTicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "cancelled";

export type SiTicketCategory = "bug" | "acces" | "demande" | "autre";

export type SiTicketUser = {
  id: string;
  name: string | null;
  email: string | null;
};

export type SiTicketListItem = {
  id: string;
  reference: string;
  title: string;
  status: SiTicketStatus;
  category: SiTicketCategory;
  creatorUserId: string;
  assigneeUserId: string | null;
  creator: SiTicketUser | null;
  assignee: SiTicketUser | null;
  driveFolderUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SiTicketDetailResponse = SiTicketDetail & {
  uploadWarnings?: string[];
};

export type SiTicketDetail = {
  ticket: {
    id: string;
    reference: string;
    title: string;
    description: string;
    status: SiTicketStatus;
    category: SiTicketCategory;
    creatorUserId: string;
    assigneeUserId: string | null;
    driveFolderId: string | null;
    driveFolderUrl: string | null;
    auditSnapshot: Record<string, unknown>[] | null;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
    creator: SiTicketUser | null;
    assignee: SiTicketUser | null;
  };
  statusLogs: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    comment: string | null;
    createdAt: string;
    user: SiTicketUser | null;
  }[];
  comments: {
    id: string;
    body: string;
    createdAt: string;
    user: SiTicketUser | null;
  }[];
  attachments: {
    id: string;
    driveFileId: string;
    name: string;
    mimeType: string | null;
    webViewLink: string | null;
    createdAt: string;
    uploader: SiTicketUser | null;
  }[];
};

export type SiNotification = {
  id: string;
  ticketId: string;
  kind: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};
