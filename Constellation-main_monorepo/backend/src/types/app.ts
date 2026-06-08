import type { auth } from "../auth";

import type { Permission } from "../ubac";

export type AppVariables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
  /**
   * Droits effectifs : permissions des groupes Google (`gw.workspace_group_permission`) dont l’utilisateur est membre ; tout si super-admin.
   */
  sessionPermissions: Permission[] | null;
};
