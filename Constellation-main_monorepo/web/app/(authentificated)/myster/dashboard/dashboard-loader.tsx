"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";

export default dynamic(() => import("./dashboard-client"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
      <Spinner className="size-8" />
      <span>Chargement du CRM…</span>
    </div>
  ),
});
