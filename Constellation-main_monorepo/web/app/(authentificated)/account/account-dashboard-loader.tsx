"use client";

import dynamic from "next/dynamic";

export default dynamic(() => import("@/components/account/account-dashboard-client"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[30vh] w-full items-start px-4 py-8 text-muted-foreground text-sm sm:px-6">
      Chargement du tableau de bord…
    </div>
  ),
});
