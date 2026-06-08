import Link from "next/link";
import { InformationNav } from "@/components/information/information-nav";
import { JaegerMysterBrand } from "@/components/jaeger-myster-brand";
import { cn } from "@/lib/utils";

export default function InformationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative flex min-h-full flex-col overflow-x-hidden",
        "bg-linear-to-b from-brand/7 via-background to-muted/25",
        "dark:from-brand/11 dark:via-background dark:to-background",
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand/40 to-transparent"
        aria-hidden
      />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-md supports-backdrop-filter:bg-background/65">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="shrink-0 self-start transition-opacity hover:opacity-90 sm:self-auto"
            aria-label="Accueil"
          >
            <JaegerMysterBrand variant="compact" />
          </Link>
          <InformationNav />
        </div>
      </header>

      <main className="relative z-0 mx-auto w-full max-w-3xl flex-1 px-6 py-8 sm:py-12">
        <div
          className={cn(
            "rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm",
            "backdrop-blur-[2px] dark:border-border/50 dark:bg-card/45 sm:p-8",
          )}
        >
          {children}
        </div>
      </main>

      <footer className="relative z-0 border-t border-border/50 bg-background/40 px-6 py-5 backdrop-blur-[1px]">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </footer>
    </div>
  );
}
