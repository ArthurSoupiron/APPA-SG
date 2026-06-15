"use client";

import Link from "next/link";
import type { AuthTab } from "@/components/auth/auth-gateway";
import { authClient } from "@/lib/auth-client";

type HomeNavProps = {
  /** Ouvre le panneau auth sur la landing (connexion / inscription). */
  onOpenAuth?: (tab: AuthTab) => void;
};

/** Liens alignés sur la session réelle (mise à jour après expiration / refetch). */
export function HomeNav({ onOpenAuth }: HomeNavProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <nav
        className="absolute right-6 top-6 h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
        aria-hidden
      />
    );
  }

  if (session?.user) {
    return (
      <nav className="absolute right-6 top-6 flex gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <Link className="hover:underline" href="/galerie-ui">
          Galerie UI
        </Link>
        <Link className="hover:underline" href="/dashboard">
          Mon compte
        </Link>
      </nav>
    );
  }

  return (
    <nav className="absolute right-6 top-6 flex gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      <Link className="hover:underline" href="/galerie-ui">
        Galerie UI
      </Link>
      {onOpenAuth ? (
        <>
          <button
            className="cursor-pointer hover:underline"
            type="button"
            onClick={() => onOpenAuth("signin")}
          >
            Connexion
          </button>
          <button
            className="cursor-pointer hover:underline"
            type="button"
            onClick={() => onOpenAuth("signup")}
          >
            Inscription
          </button>
        </>
      ) : (
        <>
          <Link className="hover:underline" href="/">
            Connexion
          </Link>
          <Link className="hover:underline" href="/">
            Inscription
          </Link>
        </>
      )}
    </nav>
  );
}
