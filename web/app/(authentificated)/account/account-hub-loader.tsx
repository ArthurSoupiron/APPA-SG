"use client";

import dynamic from "next/dynamic";

const AccountHubPage = dynamic(
  () =>
    import("@/components/account/account-hub-page").then((m) => ({
      default: m.AccountHubPage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[30vh] w-full items-start px-4 py-8 text-muted-foreground text-sm sm:px-6">
        Chargement…
      </div>
    ),
  },
);

export default function AccountHubLoader() {
  return <AccountHubPage />;
}
