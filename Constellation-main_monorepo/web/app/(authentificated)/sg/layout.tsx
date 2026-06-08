import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";

import { SgNav } from "./_components/sg-nav";
import { SgBaseProvider } from "./_lib/sg-base";
import { SgStoreProvider } from "./_lib/sg-store";

// La zone (authentificated) garantit déjà la session via RedirectIfAnonymous ;
// ce layout fournit le store SG (client/localStorage), l'en-tête et la nav.
export default function SgLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SgBaseProvider value="/sg">
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
    </SgBaseProvider>
  );
}
