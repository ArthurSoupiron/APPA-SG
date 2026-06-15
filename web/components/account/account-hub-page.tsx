"use client";

import { SiTicketsView } from "@/app/(authentificated)/si/_components/si-tickets-view";
import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";

export function AccountHubPage() {
  return (
    <AccountPageMain className="space-y-6">
      <div>
        <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Compte" />
        <PretextBlock
          as="p"
          metric={PRETEXT.sm}
          text="Suivez vos demandes au support SI."
          className="mt-1 text-muted-foreground"
        />
      </div>

      <SiTicketsView
        title="Mes tickets"
        subtitle="Créez un ticket, décrivez votre problème et joignez des documents. L’équipe SI vous répondra via ce fil."
        embedded
        titleAs="h2"
        titleMetric={PRETEXT.smMedium}
      />
    </AccountPageMain>
  );
}
