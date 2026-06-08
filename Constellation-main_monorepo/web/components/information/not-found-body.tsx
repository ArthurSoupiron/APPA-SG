"use client";

import Link from "next/link";
import { PRETEXT, PretextBlock } from "@/components/typography";

export function NotFoundBody() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <PretextBlock
        as="h1"
        text="Page introuvable"
        metric={PRETEXT.h1Page}
        className="text-2xl font-semibold text-foreground"
      />
      <PretextBlock
        as="p"
        text="La page que vous cherchez n'existe pas ou a été déplacée."
        metric={PRETEXT.base}
        className="max-w-sm text-base text-muted-foreground"
      />
      <Link
        href="/"
        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
