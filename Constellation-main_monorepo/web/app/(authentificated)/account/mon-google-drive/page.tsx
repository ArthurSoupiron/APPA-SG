import { assertBackendAccess } from "@/lib/server-authorize";

import MonGoogleDriveClient from "./mon-google-drive-client";

export default async function MonGoogleDrivePage() {
  await assertBackendAccess({
    anyOf: ["app.overview"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return <MonGoogleDriveClient />;
}
