import type { Metadata } from "next";

import { AccountPageMain } from "@/components/account/account-page-main";

import { JaegerMissionsExplorer } from "./_components/jaeger-missions-explorer";

export const metadata: Metadata = {
  title: "Jaeger — Missions",
};

export default function JaegerHomePage() {
  return (
    <AccountPageMain className="flex min-h-0 min-w-0 flex-1 flex-col p-0">
      <JaegerMissionsExplorer />
    </AccountPageMain>
  );
}
