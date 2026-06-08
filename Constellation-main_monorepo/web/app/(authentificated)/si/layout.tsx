import type { Metadata } from "next";

import { assertBackendAccess } from "@/lib/server-authorize";

export const metadata: Metadata = {
  title: "SI",
  description: "Systèmes d'information.",
};

export default async function SiLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await assertBackendAccess({
    anyOf: ["si.read"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return children;
}
