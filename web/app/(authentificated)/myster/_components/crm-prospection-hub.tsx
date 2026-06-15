"use client";

import Link from "next/link";
import { useMemo } from "react";

import { PRETEXT, PretextBlock } from "@/components/typography";
import { RequirePermission } from "@/components/ubac/require-permission";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUbacSession } from "@/lib/ubac-client";
import { CrmFranceProspectionNotice } from "./crm-france-prospection-notice";
import { CrmProspectionNavProvider, useCrmProspectionNav } from "./crm-prospection-nav-context";
import { CRM_NAV_ITEMS, type CrmNavItem, type CrmSectionId } from "./crm-sections";
import { CrmContactsSection } from "./sections/crm-contacts-section";
import { CrmSectionKpiGlobal } from "./sections/crm-section-kpi-global";
import { CrmSectionKpiMe } from "./sections/crm-section-kpi-me";
import { CrmSectionOverview } from "./sections/crm-section-overview";
import { CrmSprintDetailSection } from "./sections/crm-sprint-detail-section";
import { CrmSprintNewSection } from "./sections/crm-sprint-new-section";
import { CrmSprintsSection } from "./sections/crm-sprints-section";

function hasPerm(permissions: string[] | null, p: string) {
  return permissions?.includes(p) ?? false;
}

function CrmProspectionHubContent({ allowedSections }: { allowedSections: CrmNavItem[] }) {
  const {
    activeSection,
    sprintId,
    newSprintOpen,
    setSection,
    openSprint,
    closeSprintView,
    closeNewSprint,
    openNewSprint,
  } = useCrmProspectionNav();

  const activeItem = CRM_NAV_ITEMS.find((x) => x.id === activeSection)!;

  const tabPanelClass =
    "mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-2 outline-none";

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col px-3 py-2 sm:px-4">
      <PretextBlock
        id="crm-section-title"
        as="h2"
        metric={PRETEXT.sm}
        text={activeItem.label}
        className="sr-only"
      />
      <CrmFranceProspectionNotice className="mb-2 shrink-0" />
      <Tabs
        value={activeSection}
        onValueChange={(v) => {
          if (allowedSections.some((s) => s.id === v)) setSection(v as CrmSectionId);
        }}
        aria-labelledby="crm-section-title"
        className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-0"
      >
        <TabsList
          variant="line"
          aria-label="Sections prospection"
          className="mb-0 h-auto w-full min-w-0 shrink-0 flex-wrap justify-start gap-x-0 gap-y-0 rounded-none border-0 border-b border-border bg-transparent p-0"
        >
          {allowedSections.map((item) => (
            <TabsTrigger key={item.id} value={item.id} title={item.hint} className="shrink-0">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="vue" className={tabPanelClass}>
          <CrmSectionOverview />
        </TabsContent>
        <TabsContent value="kpi-global" className={tabPanelClass}>
          <CrmSectionKpiGlobal />
        </TabsContent>
        <TabsContent value="kpi-me" className={tabPanelClass}>
          <CrmSectionKpiMe />
        </TabsContent>
        <TabsContent value="contacts" className={tabPanelClass}>
          <CrmContactsSection />
        </TabsContent>
        <TabsContent value="sprints" className={tabPanelClass}>
          {newSprintOpen ? (
            <RequirePermission
              permission="crm.sprint.create"
              fallback={
                <div className="mx-auto max-w-lg py-8 text-center">
                  <div role="paragraph" className="text-muted-foreground text-sm">
                    Permission <code className="rounded bg-muted px-1">crm.sprint.create</code>{" "}
                    requise.
                  </div>
                  <Button type="button" className="mt-4" onClick={() => closeNewSprint()}>
                    Retour aux sprints
                  </Button>
                </div>
              }
            >
              <CrmSprintNewSection
                onBack={() => closeNewSprint()}
                onCreated={(id) => openSprint(id)}
              />
            </RequirePermission>
          ) : (
            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-0 lg:divide-x lg:divide-border">
              <aside className="w-full shrink-0 lg:sticky lg:top-0 lg:max-h-full lg:w-[min(100%,280px)] lg:min-h-0 lg:self-stretch lg:overflow-y-auto lg:pr-4">
                <CrmSprintsSection
                  selectedSprintId={sprintId}
                  onOpenSprint={openSprint}
                  onOpenNewSprint={openNewSprint}
                />
              </aside>
              <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-0 lg:pl-4">
                {sprintId ? (
                  <CrmSprintDetailSection sprintId={sprintId} onBack={closeSprintView} />
                ) : (
                  <Empty
                    role="region"
                    aria-label="Aucun sprint sélectionné"
                    className="min-h-0 flex-1 border-border bg-muted/10 px-4 py-8 sm:py-10"
                  >
                    <EmptyHeader className="max-w-prose">
                      <EmptyDescription>
                        <PretextBlock
                          as="p"
                          metric={PRETEXT.sm}
                          text="Choisissez un sprint dans la liste à gauche (publics puis privés). Les sprints privés regroupent les campagnes fermées : seuls les membres y accèdent."
                          className="whitespace-normal wrap-anywhere"
                        />
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </main>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function CrmProspectionHub() {
  const { permissions, loading } = useUbacSession();

  const allowedSections = useMemo(() => {
    if (!permissions) return [];
    return CRM_NAV_ITEMS.filter((item) => hasPerm(permissions, item.permission));
  }, [permissions]);

  const defaultSection = useMemo((): CrmSectionId => {
    if (!permissions?.length) return "contacts";
    const order: CrmSectionId[] = ["vue", "kpi-global", "kpi-me", "contacts", "sprints"];
    for (const id of order) {
      const item = CRM_NAV_ITEMS.find((x) => x.id === id);
      if (item && hasPerm(permissions, item.permission)) return id;
    }
    const first = CRM_NAV_ITEMS.find((item) => hasPerm(permissions, item.permission));
    return first?.id ?? "contacts";
  }, [permissions]);

  const allowedSectionIds = useMemo(
    () => allowedSections.map((s) => s.id) as CrmSectionId[],
    [allowedSections],
  );

  if (loading || permissions === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (allowedSections.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Prospection commerciale" />
        <div role="paragraph" className="mt-2 text-muted-foreground text-sm">
          Aucune permission CRM (crm.read, crm.kpi.read ou crm.kpi.global).
        </div>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Retour</Link>
        </Button>
      </main>
    );
  }

  return (
    <CrmProspectionNavProvider
      defaultSection={defaultSection}
      allowedSectionIds={allowedSectionIds}
    >
      <CrmProspectionHubContent allowedSections={allowedSections} />
    </CrmProspectionNavProvider>
  );
}
