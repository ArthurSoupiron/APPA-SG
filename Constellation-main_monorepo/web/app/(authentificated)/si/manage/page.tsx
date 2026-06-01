import { redirect } from "next/navigation";

import { assertBackendAccess } from "@/lib/server-authorize";

export default async function SiManageRedirectPage() {
  await assertBackendAccess({
    anyOf: ["si.ticket.manage"],
    redirectUnauthorized: "/",
    redirectForbidden: "/si",
  });
  redirect("/si?tab=manage");
}
