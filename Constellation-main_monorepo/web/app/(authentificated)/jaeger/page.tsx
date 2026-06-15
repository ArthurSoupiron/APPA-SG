import type { Metadata } from "next";
import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";

export const metadata: Metadata = {
  title: "Jaeger — Missions",
};

export default function JaegerHomePage() {
  return (
    <AccountPageMain className="space-y-4">
      <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Jaeger — Gestionnaire de missions" />
      <PretextBlock
        as="p"
        metric={PRETEXT.xs}
        text="Espace applicatif en cours de montée en charge. Utilisez la barre latérale pour accéder aux autres modules."
        className="text-sm text-muted-foreground"
      />
    </AccountPageMain>
  );
}
