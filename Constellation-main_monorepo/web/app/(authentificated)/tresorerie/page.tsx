import type { Metadata } from "next";
import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";

export const metadata: Metadata = {
  title: "Trésorerie",
};

export default function TresoreriePage() {
  return (
    <AccountPageMain className="space-y-4">
      <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Trésorerie" />
      <PretextBlock
        as="p"
        metric={PRETEXT.xs}
        text="Module Trésorerie : contenu à brancher. Navigation prête depuis la barre latérale."
        className="text-sm text-muted-foreground"
      />
    </AccountPageMain>
  );
}
