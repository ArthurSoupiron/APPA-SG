import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Spinner } from "@/components/ui/spinner";

import { SiHubPage } from "./_components/si-hub-page";

export const metadata: Metadata = {
  title: "SI",
};

export default function SiPage() {
  return (
    <AccountPageMain className="space-y-6">
      <div className="space-y-1">
        <PretextBlock as="h1" metric={PRETEXT.h1Page} text="SI" />
        <PretextBlock
          as="p"
          metric={PRETEXT.xs}
          text="Support interne : tickets, suivi et sauvegarde Drive / Google Sheets."
          className="text-sm text-muted-foreground"
        />
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        }
      >
        <SiHubPage />
      </Suspense>
    </AccountPageMain>
  );
}
