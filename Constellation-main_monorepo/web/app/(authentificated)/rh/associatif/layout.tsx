import { assertBackendAccess } from "@/lib/server-authorize";

import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";

import { SgNav } from "./_components/sg-nav";
import { SgStoreProvider } from "./_lib/sg-store";

export default async function RhAssociatifLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await assertBackendAccess({
    anyOf: ["rh.read"],
    redirectUnauthorized: "/",
    redirectForbidden: "/account/settings",
  });
  return (
    <SgStoreProvider>
      <AccountPageMain className="space-y-6">
        <div className="space-y-1">
          <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Gestion Associative (SG)" />
          <PretextBlock
            as="p"
            metric={PRETEXT.xs}
            text="Centralisation des dossiers membres et documents officiels de l'association."
            className="text-sm text-muted-foreground"
          />
        </div>
        <SgNav />
        {children}
      </AccountPageMain>
    </SgStoreProvider>
  );
}
