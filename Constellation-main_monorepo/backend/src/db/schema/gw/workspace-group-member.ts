import { sql } from "drizzle-orm";
import { check, index, text } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { gwSchema } from "../schemas";
import { workspaceGroup } from "./workspace-group";

/**
 * Arête « conteneur contient membre » (utilisateur ou sous-groupe).
 * PK surrogate : les identifiants Google peuvent contenir des caractères longs.
 */
export const workspaceGroupMember = gwSchema.table(
  "workspace_group_member",
  {
    id: text("id").primaryKey(),
    containerGroupId: text("container_group_id")
      .notNull()
      .references(() => workspaceGroup.id, { onDelete: "cascade" }),
    memberKind: text("member_kind").notNull(),
    memberUserEmail: text("member_user_email"),
    memberNestedGroupId: text("member_nested_group_id").references(() => workspaceGroup.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [
    check(
      "workspace_group_member_kind_check",
      sql`( ${t.memberKind} = 'user' AND ${t.memberUserEmail} IS NOT NULL AND ${t.memberNestedGroupId} IS NULL ) OR ( ${t.memberKind} = 'group' AND ${t.memberNestedGroupId} IS NOT NULL AND ${t.memberUserEmail} IS NULL )`,
    ),
    index("wgm_container_idx").on(t.containerGroupId),
    index("wgm_user_email_idx").on(t.memberUserEmail),
    index("wgm_nested_group_idx").on(t.memberNestedGroupId),
  ],
);
