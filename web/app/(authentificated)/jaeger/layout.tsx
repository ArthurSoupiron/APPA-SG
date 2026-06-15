import type { Metadata } from "next";

import { assertBackendAccess } from "@/lib/server-authorize";

import { JaegerQueryProvider } from "./_components/jaeger-query-provider";

export const metadata: Metadata = {
  title: "Jaeger",
  description: "Gestionnaire de missions.",
};

export default async function JaegerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await assertBackendAccess({
    anyOf: ["erp.read"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return <JaegerQueryProvider>{children}</JaegerQueryProvider>;
}
