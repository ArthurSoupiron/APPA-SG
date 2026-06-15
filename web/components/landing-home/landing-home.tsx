"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
const panelMotion = "duration-300 ease-in-out motion-reduce:transition-none motion-reduce:duration-0";

const panelContent =
  "box-border h-full w-[min(100%,22rem)] min-w-[min(100%,18rem)] overflow-x-hidden overflow-y-auto sm:w-[26rem] sm:min-w-[20rem]";

const cardClosed = "w-full max-w-[min(100%,22rem)] sm:max-w-sm";
const cardOpen = "w-fit max-w-[min(100%,50rem)]";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LandingHome() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelRendered, setPanelRendered] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  /** Capturée sur hero libre (carte sans hauteur forcée), avant / pendant le dépli. */
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);

  const captureHeroHeight = useCallback(() => {
    const h = heroRef.current?.offsetHeight;
    return h && h > 0 ? h : null;
  }, []);

  /** Mesure initiale + recalcul uniquement quand le panneau est entièrement fermé. */
  useLayoutEffect(() => {
    if (panelOpen || panelRendered) return;
    const h = captureHeroHeight();
    if (h) setLockedHeight(h);

    const el = heroRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (panelOpen || panelRendered) return;
      const next = captureHeroHeight();
      if (next) setLockedHeight(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [captureHeroHeight, panelOpen, panelRendered]);

  const togglePanel = useCallback(() => {
    if (!panelOpen) {
      const h = captureHeroHeight() ?? lockedHeight;
      if (h) setLockedHeight(h);
      setPanelRendered(true);
      setPanelOpen(true);
      return;
    }
    setPanelOpen(false);
    if (prefersReducedMotion()) setPanelRendered(false);
  }, [captureHeroHeight, lockedHeight, panelOpen]);

  const onPanelTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (panelOpen) return;
      if (event.propertyName !== "grid-template-columns") return;
      setPanelRendered(false);
    },
    [panelOpen],
  );

  useEffect(() => {
    if (panelOpen || !panelRendered) return;
    const id = window.setTimeout(() => setPanelRendered(false), 350);
    return () => window.clearTimeout(id);
  }, [panelOpen, panelRendered]);

  const panelActive = panelOpen || panelRendered;
  const cardStyle =
    panelActive && lockedHeight !== null ? { height: lockedHeight } : undefined;

  return (
    <div className={cn(shell, "dark")}>
      <StarrySkyBackground />
      <main
        className={cn(
          main,
          panelOpen && "w-full max-w-none justify-start overflow-x-auto overscroll-x-contain",
        )}
      >
        <div
          className={cn(
            "flex w-full flex-row overflow-hidden rounded-2xl border shadow-none",
            borderPanel,
            bgClear,
            panelOpen ? cardOpen : cardClosed,
          )}
          id="bloc-jarvis"
          style={cardStyle}
        >
          <section
            ref={heroRef}
            className={cn(
              "flex shrink-0 cursor-pointer flex-col items-center gap-y-8 px-8 py-8 text-center sm:px-10",
              panelOpen
                ? "w-[min(100%,20rem)] flex-none justify-center sm:w-sm sm:px-8"
                : "w-full min-w-0",
            )}
            onClick={togglePanel}
          >
            <JaegerMysterBrand
              className="pointer-events-none w-full max-w-full shrink-0"
              layout="stacked"
              variant="landing"
            />
            <PretextBlock
              as="h1"
              className="font-heading w-full max-w-full px-1 text-xl font-semibold tracking-tight sm:text-2xl"
              metric={landingTitleMetric}
              text={landingHeroCopy.title}
            />
            <Button
              aria-controls="connexion-jarvis"
              aria-expanded={panelOpen}
              className="shrink-0"
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

          <div
            className={cn(
              "grid h-full min-h-0 min-w-0 overflow-hidden grid-cols-[0fr] transition-[grid-template-columns]",
              panelMotion,
              panelOpen && "grid-cols-[1fr]",
            )}
            onTransitionEnd={onPanelTransitionEnd}
          >
            <div className="h-full min-h-0 min-w-0 overflow-hidden">
              <aside
                aria-hidden={!panelOpen}
                aria-labelledby="connexion-jarvis-title"
                className={cn(
                  bgClear,
                  "border-border/100 box-border h-full overflow-hidden border-l",
                  !panelOpen && "pointer-events-none",
                )}
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
                {panelRendered ? (
                  <div
                    className={cn(
                      panelContent,
                      panelMotion,
                      "p-4 transition-opacity sm:p-5",
                      panelOpen ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <AuthGatewayLanding embedded initialTab="signin" />
                  </div>
                ) : null}
              </aside>
            </div>
          </div>
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
