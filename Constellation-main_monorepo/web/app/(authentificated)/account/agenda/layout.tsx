import { assertBackendAccess } from "@/lib/server-authorize";

export default async function AccountAgendaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await assertBackendAccess({
    anyOf: ["agenda.read"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return children;
}
