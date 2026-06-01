import type { Metadata } from "next";

import { SgNav } from "../(authentificated)/rh/associatif/_components/sg-nav";
import { SgBaseProvider } from "../(authentificated)/rh/associatif/_lib/sg-base";
import { SgStoreProvider } from "../(authentificated)/rh/associatif/_lib/sg-store";

export const metadata: Metadata = {
  title: "Démo — Gestion Associative (SG)",
  robots: { index: false, follow: false },
};

// Vitrine publique du module SG : mêmes composants que /rh/associatif, mais
// sans la coquille authentifiée (pas de backend requis). Le store reste en
// localStorage, donc tout est pleinement interactif.
export default function SgDemoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SgBaseProvider value="/sg-demo">
      <SgStoreProvider>
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-8">
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            Mode <strong>démonstration</strong> — accès libre, données fictives stockées
            localement dans votre navigateur. La version réelle est protégée par
            authentification sous <code>/rh/associatif</code>.
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Gestion Associative (SG)</h1>
            <p className="text-sm text-muted-foreground">
              Centralisation des dossiers membres et documents officiels de l&apos;association.
            </p>
          </div>
          <SgNav />
          {children}
        </div>
      </SgStoreProvider>
    </SgBaseProvider>
  );
}
