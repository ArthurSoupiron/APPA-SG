"use client";

import { PRETEXT, PretextBlock } from "@/components/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { CrmSprintDetailProspectsTable } from "./crm-sprint-detail-prospects-table";
import type { Member, SpRow } from "./crm-sprint-detail-types";

export function CrmSprintDetailProspectsWorkCard(props: {
  isMgr: boolean;
  currentUserId: string | undefined;
  prospects: SpRow[];
  members: Member[];
  selectedBulk: Set<string>;
  setSelectedBulk: (s: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  onPatchProspect: (prospectId: string, body: Record<string, unknown>) => void;
  onOpenFiche: (p: SpRow) => void;
}) {
  const {
    isMgr,
    currentUserId,
    prospects,
    members,
    selectedBulk,
    setSelectedBulk,
    onPatchProspect,
    onOpenFiche,
  } = props;

  return (
    <Card className="border-brand/15">
      <CardHeader className="border-b border-border/50 py-3">
        <PretextBlock
          as="h2"
          metric={PRETEXT.smMedium}
          text={isMgr ? "Prospects du sprint" : "Mes prospects (assignés à vous)"}
        />
        <PretextBlock
          as="p"
          metric={PRETEXT.xs}
          text={
            isMgr
              ? "Statut et assignation ici ; import, ajout depuis la base et actions groupées sont dans l’onglet Configuration."
              : "Ouvrez une fiche sur la droite pour le détail complet."
          }
          className="mt-1 text-muted-foreground whitespace-normal break-words [overflow-wrap:anywhere]"
        />
      </CardHeader>
      <CardContent className="p-0">
        <CrmSprintDetailProspectsTable
          isMgr={isMgr}
          currentUserId={currentUserId}
          prospects={prospects}
          members={members}
          selectedBulk={selectedBulk}
          setSelectedBulk={setSelectedBulk}
          onPatchProspect={onPatchProspect}
          onOpenFiche={onOpenFiche}
        />
      </CardContent>
    </Card>
  );
}
