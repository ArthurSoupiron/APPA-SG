"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";
import { AuthPageShell } from "@/components/auth-page-shell";
import { authClient } from "@/lib/auth-client";

/** Pages protégées : si non connecté → landing avec panneau connexion */
export function RedirectIfAnonymous({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending, error } = authClient.useSession();

  useLayoutEffect(() => {
    if (isPending) return;
    if (error || !session?.user) {
      router.replace("/");
    }
  }, [isPending, session, error, router]);

  if (isPending) {
    return <AuthPageShell />;
  }
  if (error || !session?.user) {
    return <AuthPageShell />;
  }
  return <>{children}</>;
}
