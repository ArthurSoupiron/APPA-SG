import { assertBackendAccess } from "@/lib/server-authorize";

import ActivitiesLoader from "./activities-loader";

export default async function CrmActivitiesPage() {
  await assertBackendAccess({
    anyOf: ["crm.read"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return <ActivitiesLoader />;
}
