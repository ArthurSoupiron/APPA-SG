import type { Metadata } from "next";
import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";

export const metadata: Metadata = {
  title: "Gestion Associative (SG)",
};

export default function RhAssociatifPage() {
  return (
    <AccountPageMain className="space-y-4">
      <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Gestion Associative (SG)" />
      <PretextBlock
        as="p"
        metric={PRETEXT.xs}
        text="Module SG : contenu à brancher. Navigation prête depuis la barre latérale."
        className="text-sm text-muted-foreground"
      />
    </AccountPageMain>
  );
}
