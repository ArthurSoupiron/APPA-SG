"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AuthGatewayLanding } from "@/components/auth/auth-gateway";
import { JaegerMysterBrand } from "@/components/jaeger-myster-brand";
import { StarrySkyBackground } from "@/components/starry-sky-background";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { landingHeroCopy, landingTitleMetric } from "./pretext-landing";

const shell =
  "relative flex min-h-dvh w-full flex-1 flex-col items-center overflow-x-hidden overflow-y-auto p-6 sm:p-8 max-lg:justify-start max-lg:pt-10 lg:justify-center";
const main = "relative z-10 flex w-full flex-col items-center";

const borderPanel = "border-border/100";
const bgClear = "bg-transparent";
const easeOut300 = "duration-300 ease-out motion-reduce:transition-none";

const transitionCard = cn("transition-[max-width]", easeOut300);
const transitionAside = cn(
  "max-lg:transition-[max-height] max-lg:duration-300 max-lg:ease-out",
  "lg:transition-[width] lg:duration-300 lg:ease-out",
  "motion-reduce:transition-none",
);

/** Même hauteur plié / déplié : seule la largeur max change à l’ouverture. */
const layoutBase = "h-auto min-h-0 lg:h-auto lg:min-h-0";
const layoutClosed = cn(layoutBase, "max-w-[min(100%,22rem)] sm:max-w-sm");
const layoutOpen = cn(layoutBase, "max-w-5xl");

const asideOpen = "max-h-[2200px] lg:max-h-none lg:w-[min(100%,26rem)]";
const asideClosed = "max-h-0 lg:max-h-none lg:w-0";

const col = "flex min-h-0 flex-1 flex-col overflow-y-auto";
const section = cn(col, "cursor-pointer p-6 sm:p-7 lg:min-w-0 lg:px-8 lg:py-8");
const hero = "flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-1 text-center";
const auth = cn(col, "p-4 sm:p-5");

const card = cn(
  "w-full flex flex-col overflow-hidden rounded-2xl border shadow-none lg:flex-row",
  borderPanel,
  bgClear,
  transitionCard,
);

const aside = cn(
  "shrink-0 overflow-hidden border-t lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:border-t-0 lg:border-l",
  borderPanel,
  bgClear,
  transitionAside,
);

export function LandingHome() {
  const [panelOpen, setPanelOpen] = useState(false);

  const togglePanel = useCallback(() => {
    setPanelOpen((o) => !o);
  }, []);

  return (
    /* Fond canvas toujours sombre : forcer les tokens `dark` ici pour que
     * `text-foreground` / labels ne restent pas en encre « mode clair » sur le ciel. */
    <div className={cn(shell, "dark")}>
      <StarrySkyBackground />
      <main className={main}>
        <div className={cn(card, panelOpen ? layoutOpen : layoutClosed)} id="bloc-jarvis">
          <section className={section} onClick={togglePanel}>
            <JaegerMysterBrand
              className="pointer-events-none shrink-0 self-start"
              variant="landing"
            />
            <div className={hero}>
              <PretextBlock
                as="h1"
                className="font-heading text-xl font-semibold tracking-tight sm:text-2xl"
                metric={landingTitleMetric}
                text={landingHeroCopy.title}
              />
            </div>
            <Button
              aria-controls="connexion-jarvis"
              aria-expanded={panelOpen}
              className="mt-4 shrink-0 self-center"
              size="lg"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePanel();
              }}
            >
              {panelOpen ? "Fermer" : "Accéder à Constellation"}
            </Button>
          </section>

          <aside
            aria-hidden={!panelOpen}
            aria-labelledby="connexion-jarvis-title"
            className={cn(aside, panelOpen ? asideOpen : asideClosed)}
            id="connexion-jarvis"
            inert={!panelOpen ? true : undefined}
          >
            <PretextBlock
              as="h2"
              className="sr-only"
              id="connexion-jarvis-title"
              metric={PRETEXT.smMedium}
              text="Connexion ou inscription"
            />
            <div className={auth}>
              <AuthGatewayLanding embedded initialTab="signin" />
            </div>
          </aside>
        </div>
      </main>

      <footer className="relative z-20 flex shrink-0 justify-center gap-x-5 pb-5 pt-3 pointer-events-auto">
        {(
          [
            ["/mentions-legales", "Mentions légales"],
            ["/confidentialite", "Confidentialité"],
            ["/cgu", "CGU"],
            ["/a-propos", "À propos"],
          ] as const
        ).map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="relative z-20 text-xs text-zinc-400 transition-colors hover:text-zinc-200 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            {label}
          </Link>
        ))}
      </footer>
    </div>
  );
}
