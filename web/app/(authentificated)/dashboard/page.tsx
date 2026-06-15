import { assertBackendAccess } from "@/lib/server-authorize";

import DashboardLoader from "./dashboard-loader";

export default async function DashboardPage() {
  await assertBackendAccess({
    anyOf: ["app.overview", "agenda.read"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return <DashboardLoader />;
}
