import { CRM_APP_ENTRY_PERMISSIONS } from "@myster/_components/crm-sections";
import type { Metadata } from "next";
import { assertBackendAccess } from "@/lib/server-authorize";

export const metadata: Metadata = {
  title: "Myster",
  description: "CRM — prospection et relations clients.",
};

export default async function MysterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await assertBackendAccess({
    anyOf: CRM_APP_ENTRY_PERMISSIONS,
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return children;
}
