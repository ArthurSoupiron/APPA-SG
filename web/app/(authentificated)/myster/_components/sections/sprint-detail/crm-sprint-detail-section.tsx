"use client";

import { isoToLocalYmd } from "@myster/_lib/crm-day";
import { CRM_SECTEUR_FILTER_ALL } from "@myster/_lib/crm-secteurs";
import { useEffect, useState } from "react";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUbacSession } from "@/lib/ubac-client";

import { CrmSprintDetailEditDialog } from "./crm-sprint-detail-edit-dialog";
import { CrmSprintDetailFicheSheet } from "./crm-sprint-detail-fiche-sheet";
import { CrmSprintDetailHeader } from "./crm-sprint-detail-header";
import { CrmSprintDetailMembersCard } from "./crm-sprint-detail-members-card";
import { CrmSprintDetailPickDialog } from "./crm-sprint-detail-pick-dialog";
import { CrmSprintDetailProspectsManagerPanel } from "./crm-sprint-detail-prospects-manager-panel";
import { CrmSprintDetailProspectsWorkCard } from "./crm-sprint-detail-prospects-work-card";
import { emptyFicheForm } from "./crm-sprint-detail-types";
import { useCrmSprintDetail } from "./use-crm-sprint-detail";

export type CrmSprintDetailSectionProps = {
  sprintId: string;
  onBack: () => void;
};

export function CrmSprintDetailSection({ sprintId, onBack }: CrmSprintDetailSectionProps) {
  const { userId: currentUserId } = useUbacSession();
  const d = useCrmSprintDetail(sprintId, onBack, currentUserId ?? undefined);
  const [sprintTab, setSprintTab] = useState<"work" | "config">("work");

  const isMgr = Boolean(d.sprint?.isManager);

  useEffect(() => {
    setSprintTab("work");
  }, [sprintId]);

  if (!d.id) return null;

  if (d.loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!d.sprint) {
    return (
      <div className="mx-auto w-full min-w-0 px-3 py-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const canEditFiche = d.ficheRow != null && (isMgr || d.ficheRow.assignedUserId === currentUserId);

  const dateLine =
    d.sprint.dateStart || d.sprint.dateEnd
      ? `${d.sprint.dateStart ? isoToLocalYmd(d.sprint.dateStart) : "…"} → ${d.sprint.dateEnd ? isoToLocalYmd(d.sprint.dateEnd) : "…"}`
      : null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-3 px-1 py-2 sm:px-2">
      <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button type="button" variant="ghost" size="sm" className="mb-1 px-0" onClick={onBack}>
            ← Liste des sprints
          </Button>
          <PretextBlock as="h1" metric={PRETEXT.smMedium} text={d.sprint.name} />
          {d.sprint.theme ? (
            <PretextBlock
              as="p"
              metric={PRETEXT.sm}
              text={d.sprint.theme}
              className="text-muted-foreground"
            />
          ) : null}
          {dateLine ? (
            <PretextBlock
              as="p"
              metric={PRETEXT.xs}
              text={dateLine}
              className="mt-1 font-medium text-brand"
            />
          ) : null}
          <PretextBlock
            as="p"
            metric={PRETEXT.xs}
            text={d.sprint.isPublic ? "Sprint public" : "Sprint privé (fermé)"}
            className="mt-1 text-muted-foreground uppercase tracking-wide"
          />
        </div>
      </div>

      <Tabs
        value={sprintTab}
        onValueChange={(v) => setSprintTab(v === "config" ? "config" : "work")}
        className="w-full min-w-0"
      >
        <TabsList className="h-auto w-full min-w-0 flex-wrap justify-start gap-1 rounded-md border border-border bg-muted/30 p-1">
          <TabsTrigger value="work" className="shrink-0">
            Travail
          </TabsTrigger>
          {isMgr ? (
            <TabsTrigger value="config" className="shrink-0">
              Configuration
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="work" className="mt-3 min-w-0 outline-none">
          <CrmSprintDetailProspectsWorkCard
            isMgr={isMgr}
            currentUserId={currentUserId ?? undefined}
            prospects={d.prospects}
            members={d.members}
            selectedBulk={d.selectedBulk}
            setSelectedBulk={d.setSelectedBulk}
            onPatchProspect={(prospectId, body) => void d.patchProspect(prospectId, body)}
            onOpenFiche={(p) => void d.openFiche(p)}
          />
        </TabsContent>

        {isMgr ? (
          <TabsContent value="config" className="mt-3 min-w-0 space-y-3 outline-none">
            <CrmSprintDetailHeader
              variant="managerOnly"
              onBack={onBack}
              sprint={d.sprint}
              dateLine={dateLine}
              isMgr={isMgr}
              onOpenEdit={() => d.openEditSprint()}
              onDelete={() => void d.deleteSprint()}
            />
            <CrmSprintDetailMembersCard
              isMgr={isMgr}
              members={d.members}
              userOptions={d.userOptions}
              addMemberId={d.addMemberId}
              setAddMemberId={d.setAddMemberId}
              onAddMembers={() => void d.addMembers()}
              onRemoveMember={(uid) => void d.removeMember(uid)}
            />
            <CrmSprintDetailProspectsManagerPanel
              members={d.members}
              prospects={d.prospects}
              importAssigneeId={d.importAssigneeId}
              setImportAssigneeId={d.setImportAssigneeId}
              importBusy={d.importBusy}
              onImportFile={(e) => void d.onImportFile(e)}
              selectedBulk={d.selectedBulk}
              setSelectedBulk={d.setSelectedBulk}
              bulkAssignTo={d.bulkAssignTo}
              setBulkAssignTo={d.setBulkAssignTo}
              bulkBusy={d.bulkBusy}
              randomBusy={d.randomBusy}
              onRunBulkAssign={(uid, ids) => void d.runBulkAssign(uid, ids)}
              onRandomAssign={(scope) => void d.randomAssignAmongMembers(scope)}
              onOpenPick={() => {
                d.setPickSecteur(CRM_SECTEUR_FILTER_ALL);
                d.setPickIds(new Set());
                d.setPickOpen(true);
                void d.loadProspectsForPick(CRM_SECTEUR_FILTER_ALL);
              }}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      <CrmSprintDetailFicheSheet
        open={d.ficheOpen}
        onOpenChange={(open) => {
          d.setFicheOpen(open);
          if (!open) {
            d.setFicheRow(null);
            d.setFicheForm(emptyFicheForm());
          }
        }}
        ficheLoading={d.ficheLoading}
        canEditFiche={canEditFiche}
        ficheRow={d.ficheRow}
        ficheForm={d.ficheForm}
        setFicheForm={d.setFicheForm}
        ficheSaving={d.ficheSaving}
        onSave={() => void d.saveFiche()}
      />

      <CrmSprintDetailPickDialog
        open={d.pickOpen}
        onOpenChange={d.setPickOpen}
        pickSecteur={d.pickSecteur}
        setPickSecteur={d.setPickSecteur}
        onSecteurChange={(v) => void d.loadProspectsForPick(v)}
        pickDefaultAssignee={d.pickDefaultAssignee}
        setPickDefaultAssignee={d.setPickDefaultAssignee}
        members={d.members}
        allProspects={d.allProspects}
        pickIds={d.pickIds}
        setPickIds={d.setPickIds}
        onAddPicked={() => void d.addPickedProspects()}
      />

      <CrmSprintDetailEditDialog
        open={d.editOpen}
        onOpenChange={d.setEditOpen}
        editName={d.editName}
        setEditName={d.setEditName}
        editTheme={d.editTheme}
        setEditTheme={d.setEditTheme}
        editStart={d.editStart}
        setEditStart={d.setEditStart}
        editEnd={d.editEnd}
        setEditEnd={d.setEditEnd}
        editPublic={d.editPublic}
        setEditPublic={d.setEditPublic}
        editBusy={d.editBusy}
        onSave={() => void d.saveEditSprint()}
      />
    </div>
  );
}
