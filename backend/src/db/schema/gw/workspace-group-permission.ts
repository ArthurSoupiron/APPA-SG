import { index, primaryKey, text } from "drizzle-orm/pg-core";

import { gwSchema } from "../schemas";
import { workspaceGroup } from "./workspace-group";

/** Permissions UBAC (catalogue) attachées à un groupe Google synchronisé. */
export const workspaceGroupPermission = gwSchema.table(
  "workspace_group_permission",
  {
    workspaceGroupId: text("workspace_group_id")
      .notNull()
      .references(() => workspaceGroup.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceGroupId, t.permission] }),
    index("wgp_permission_idx").on(t.permission),
  ],
);
