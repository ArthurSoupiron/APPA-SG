"use client";

import dynamic from "next/dynamic";

export default dynamic(() => import("./activities-client"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
      Chargement…
    </div>
  ),
});
