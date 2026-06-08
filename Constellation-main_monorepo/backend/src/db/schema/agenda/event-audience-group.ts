import { index, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { workspaceGroup } from "../gw/workspace-group";
import { agendaSchema } from "../schemas";
import { agendaEvent } from "./event";

/** Visibilité : membres des groupes Google Workspace liés à l’UBAC. */
export const agendaEventAudienceGroup = agendaSchema.table(
  "event_audience_group",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => agendaEvent.id, { onDelete: "cascade" }),
    workspaceGroupId: text("workspace_group_id")
      .notNull()
      .references(() => workspaceGroup.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.workspaceGroupId] }),
    index("event_audience_group_group_idx").on(t.workspaceGroupId),
  ],
);
