import type { Metadata } from "next";

import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";

import { ActionPlanView } from "./_components/action-plan-view";

export const metadata: Metadata = {
  title: "Plan d'action",
};

export default function PlanActionPage() {
  return (
    <AccountPageMain className="space-y-6">
      <div className="space-y-1">
        <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Plan d'action" />
        <PretextBlock
          as="p"
          metric={PRETEXT.xs}
          text="Pilotage organisationnel : arbre hiérarchique, Kanban, Gantt et indicateurs."
          className="text-sm text-muted-foreground"
        />
      </div>
      <ActionPlanView />
    </AccountPageMain>
  );
}
