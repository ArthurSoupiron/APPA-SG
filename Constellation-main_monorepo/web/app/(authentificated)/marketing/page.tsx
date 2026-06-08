import type { Metadata } from "next";

import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { MarketingDashboard } from "./_components/marketing-dashboard";
import { MarketingNav } from "./_components/marketing-nav";

export const metadata: Metadata = {
  title: "Marketing",
};

export default function MarketingPage() {
  return (
    <AccountPageMain className="space-y-6">
      <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Marketing" />
      <MarketingNav />
      <MarketingDashboard />
    </AccountPageMain>
  );
}
