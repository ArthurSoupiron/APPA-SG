"use client";

import { type ReactNode, useEffect, useState } from "react";

import { Spinner } from "@/components/ui/spinner";

type Props = {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Garde client secondaire : `GET /api/app/authorize` (même logique que les routes Hono).
 * Pour une page entière, préférer `assertBackendAccess` + `next/dynamic` dans un Server Component.
 */
export function RequirePermission({ permission, children, fallback = null }: Props) {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    const ac = new AbortController();

    async function run() {
      try {
        const q = new URLSearchParams({ permission });
        const res = await fetch(`/api/app/authorize?${q}`, {
          credentials: "include",
          cache: "no-store",
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        if (res.status !== 200) {
          setState("denied");
          return;
        }
        const j: { ok?: boolean } = await res.json().catch(() => ({}));
        setState(j.ok ? "ok" : "denied");
      } catch {
        if (!ac.signal.aborted) setState("denied");
      }
    }

    void run();
    return () => ac.abort();
  }, [permission]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }
  if (state === "denied") return fallback;
  return <>{children}</>;
}
