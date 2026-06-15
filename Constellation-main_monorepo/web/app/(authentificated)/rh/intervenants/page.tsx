import type { Metadata } from "next";
import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";

export const metadata: Metadata = {
  title: "Gestion Intervenant (RDI)",
};

export default function RhIntervenantsPage() {
  return (
    <AccountPageMain className="space-y-4">
      <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Gestion Intervenant (RDI)" />
      <PretextBlock
        as="p"
        metric={PRETEXT.xs}
        text="Module RDI : contenu à brancher. Navigation prête depuis la barre latérale."
        className="text-sm text-muted-foreground"
      />
    </AccountPageMain>
  );
}
