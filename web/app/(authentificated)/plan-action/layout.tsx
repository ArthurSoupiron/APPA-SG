import type { Metadata } from "next";

import { assertBackendAccess } from "@/lib/server-authorize";

export const metadata: Metadata = {
  title: "Plan d'action",
  description: "Pilotage du plan d'action organisationnel.",
};

export default async function PlanActionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await assertBackendAccess({
    anyOf: ["action_plan.read"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return children;
}
