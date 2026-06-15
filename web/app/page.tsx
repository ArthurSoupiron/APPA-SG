"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";
import { LandingHome } from "@/components/landing-home";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useLayoutEffect(() => {
    if (isPending) return;
    if (session?.user) {
      router.replace("/dashboard");
    }
  }, [isPending, session, router]);

  if (!isPending && session?.user) {
    return null;
  }

  return <LandingHome />;
}
