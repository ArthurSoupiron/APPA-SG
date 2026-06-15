import type { Metadata } from "next";
import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";

export const metadata: Metadata = {
  title: "App RH — Gestion RH (CDM)",
};

export default function RhCdmPage() {
  return (
    <AccountPageMain className="space-y-4">
      <PretextBlock as="h1" metric={PRETEXT.h1Page} text="App RH — Gestion RH (CDM)" />
      <PretextBlock
        as="p"
        metric={PRETEXT.xs}
        text="Module CDM : contenu à brancher. Navigation prête depuis la barre latérale."
        className="text-sm text-muted-foreground"
      />
    </AccountPageMain>
  );
}
