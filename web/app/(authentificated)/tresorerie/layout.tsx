import type { Metadata } from "next";

import { assertBackendAccess } from "@/lib/server-authorize";

export const metadata: Metadata = {
  title: "Trésorerie",
  description: "Gestion de trésorerie.",
};

export default async function TresorerieLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await assertBackendAccess({
    anyOf: ["tresorerie.read"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return children;
}
