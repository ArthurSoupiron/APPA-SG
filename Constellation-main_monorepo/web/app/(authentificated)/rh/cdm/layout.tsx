import { assertBackendAccess } from "@/lib/server-authorize";

export default async function RhCdmLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await assertBackendAccess({
    anyOf: ["rh.read"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return children;
}
