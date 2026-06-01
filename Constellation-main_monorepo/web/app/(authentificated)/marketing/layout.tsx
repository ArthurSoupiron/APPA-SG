import type { Metadata } from "next";

import { assertBackendAccess } from "@/lib/server-authorize";

export const metadata: Metadata = {
  title: "Marketing",
  description: "Communication et marketing.",
};

export default async function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await assertBackendAccess({
    anyOf: ["marketing.read"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return children;
}
