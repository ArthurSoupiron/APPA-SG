"use client";

import Link from "next/link";
import { PRETEXT, PretextBlock } from "@/components/typography";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: ErrorProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 py-20 text-center dark:bg-black">
      <PretextBlock
        as="h1"
        text="Une erreur est survenue"
        metric={PRETEXT.h1Page}
        className="text-2xl font-semibold text-foreground"
      />
      <PretextBlock
        as="p"
        text="Quelque chose s'est mal passé. Vous pouvez réessayer ou revenir à l'accueil."
        metric={PRETEXT.base}
        className="max-w-sm text-base text-muted-foreground"
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
