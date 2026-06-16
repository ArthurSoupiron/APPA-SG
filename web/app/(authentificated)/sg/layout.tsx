import type { CSSProperties } from "react";

import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";

import { SgNav } from "./_components/sg-nav";
import { SgBaseProvider } from "./_lib/sg-base";
import { SgStoreProvider } from "./_lib/sg-store";

// Palette « bordeaux & crème » appliquée UNIQUEMENT au module SG via surcharge
// des variables de thème (le reste de Constellation garde son vert).
const SG_THEME = {
  "--background": "#f7f1e7",
  "--foreground": "#3c2530",
  "--card": "#fffdf8",
  "--card-foreground": "#3c2530",
  "--popover": "#fffdf8",
  "--popover-foreground": "#3c2530",
  "--primary": "#7a2233",
  "--primary-foreground": "#f7f1e7",
  "--secondary": "#ece0cf",
  "--secondary-foreground": "#5a2330",
  "--muted": "#efe6d7",
  "--muted-foreground": "#8a6b5f",
  "--accent": "#ecd9c6",
  "--accent-foreground": "#5a2330",
  "--border": "#e0d2bd",
  "--input": "#e0d2bd",
  "--ring": "#7a2233",
  "--destructive": "#b3261e",
  "--destructive-foreground": "#f7f1e7",
} as CSSProperties;

// La zone (authentificated) garantit déjà la session via RedirectIfAnonymous ;
// ce layout fournit le store SG, l'en-tête, la nav et le thème bordeaux/crème.
export default function SgLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SgBaseProvider value="/sg">
      <SgStoreProvider>
        <AccountPageMain>
          <div
            style={SG_THEME}
            className="space-y-6 rounded-xl border border-border bg-background p-4 text-foreground sm:p-6"
          >
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
          </div>
        </AccountPageMain>
      </SgStoreProvider>
    </SgBaseProvider>
  );
}
