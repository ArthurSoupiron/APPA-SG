import type { Metadata } from "next";

import { assertBackendAccess } from "@/lib/server-authorize";

export const metadata: Metadata = {
  title: "Jaeger",
  description: "Gestionnaire de missions.",
};

export default async function JaegerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await assertBackendAccess({
    anyOf: ["app.operations"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return children;
}
