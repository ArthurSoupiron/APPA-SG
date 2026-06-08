import { assertBackendAccess } from "@/lib/server-authorize";

import AccountDashboardLoader from "./account-dashboard-loader";

export default async function AccountPage() {
  await assertBackendAccess({
    anyOf: ["app.overview"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return <AccountDashboardLoader />;
}
