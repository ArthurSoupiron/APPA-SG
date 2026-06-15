"use client";

import { useMemo, useState } from "react";

import { PRETEXT, PretextBlock } from "@/components/typography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUbacSession } from "@/lib/ubac-client";

import { SiRecoveryButton } from "./si-recovery-button";
import { SI_NAV_ITEMS, type SiNavItem, type SiSectionId } from "./si-sections";
import { SiTicketsView } from "./si-tickets-view";
import { SiRegistresSection } from "./registres/si-registres-section";

function hasPerm(permissions: string[] | null, p: string) {
  return permissions?.includes(p) ?? false;
}

export function SiHub() {
  const { permissions } = useUbacSession();
  const allowedSections = useMemo(
    () => SI_NAV_ITEMS.filter((item) => hasPerm(permissions, item.permission)),
    [permissions],
  );
  const [activeSection, setActiveSection] = useState<SiSectionId>(
    allowedSections[0]?.id ?? "tickets",
  );

  const activeItem: SiNavItem =
    allowedSections.find((s) => s.id === activeSection) ?? allowedSections[0] ?? SI_NAV_ITEMS[0];

  if (allowedSections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground whitespace-normal break-words">
        Aucune section SI accessible avec vos permissions actuelles.
      </p>
    );
  }

  const tabPanelClass =
    "mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-2 outline-none";

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col space-y-4">
      <div className="space-y-1 shrink-0">
        <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Panel SI" />
        <PretextBlock
          as="p"
          metric={PRETEXT.xs}
          text="Tickets support, registres de conformité S.I. et traitements de données."
          className="text-sm text-muted-foreground"
        />
      </div>

      <Tabs
        value={activeSection}
        onValueChange={(v) => {
          if (allowedSections.some((s) => s.id === v)) setActiveSection(v as SiSectionId);
        }}
        className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-0"
      >
        <TabsList
          variant="line"
          aria-label="Sections SI"
          className="mb-0 h-auto w-full min-w-0 shrink-0 flex-wrap justify-start gap-x-0 gap-y-0 rounded-none border-0 border-b border-border bg-transparent p-0"
        >
          {allowedSections.map((item) => (
            <TabsTrigger key={item.id} value={item.id} title={item.hint} className="shrink-0">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <PretextBlock
          id="si-section-title"
          as="h2"
          metric={PRETEXT.sm}
          text={activeItem.label}
          className="sr-only"
        />

        {allowedSections.some((s) => s.id === "tickets") && (
          <TabsContent value="tickets" className={tabPanelClass}>
            <SiTicketsView
              title="Tickets"
              subtitle="Tous les tickets du support interne."
              manageMode
              recoveryAction={<SiRecoveryButton />}
              embedded
            />
          </TabsContent>
        )}

        {allowedSections.some((s) => s.id === "registres") && (
          <TabsContent value="registres" className={tabPanelClass}>
            <SiRegistresSection />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
