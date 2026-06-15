"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  FileKey,
  FileText,
  KeyRound,
  Scale,
  Shield,
  Trash2,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConformitySectionId, RegistreDto, TraitementDataDto } from "../../_lib/si-registres-types";
import { DroitsRgpdPlaceholderView } from "./droits-rgpd/droits-rgpd-placeholder-view";
import { RegistresManagement } from "./registres-management";
import { TraitementDataView } from "./traitement-data-view";

const STORAGE_KEYS = {
  sidebarExpanded: "jaegermyster.si.conformityExplorer.sidebarExpanded",
  selectedSection: "jaegermyster.si.conformityExplorer.selectedSection",
};

type SectionDef = {
  id: ConformitySectionId;
  label: string;
  group: "registre" | "droits";
  icon: ComponentType<{ className?: string }>;
};

const SECTIONS: SectionDef[] = [
  { id: "registre-licences", label: "Licences", group: "registre", icon: FileKey },
  { id: "registre-rgpd", label: "RGPD", group: "registre", icon: Shield },
  { id: "registre-bdd", label: "Bases de données", group: "registre", icon: Database },
  { id: "registre-traitement-data", label: "Traitements de données", group: "registre", icon: FileText },
  { id: "droit-acces", label: "Droit d'accès", group: "droits", icon: UserCheck },
  { id: "droit-rectification", label: "Rectification", group: "droits", icon: Scale },
  { id: "droit-effacement", label: "Effacement", group: "droits", icon: Trash2 },
  { id: "droit-opposition", label: "Opposition", group: "droits", icon: KeyRound },
  { id: "droit-portabilite", label: "Portabilité", group: "droits", icon: FileText },
];

type Props = {
  initialRegistres: RegistreDto[];
  initialTraitements: TraitementDataDto[];
  canEdit: boolean;
  canDelete: boolean;
  onRegistresChange: (registres: RegistreDto[]) => void;
  onTraitementsChange: (traitements: TraitementDataDto[]) => void;
  onReload: () => Promise<void>;
  traitementDataTemplateUrl: string;
};

export function SiConformityExplorer({
  initialRegistres,
  initialTraitements,
  canEdit,
  canDelete,
  onRegistresChange,
  onTraitementsChange,
  onReload,
  traitementDataTemplateUrl,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [section, setSection] = useState<ConformitySectionId>("registre-licences");

  useEffect(() => {
    const storedExpanded = localStorage.getItem(STORAGE_KEYS.sidebarExpanded);
    if (storedExpanded !== null) setExpanded(storedExpanded === "true");
    const storedSection = localStorage.getItem(STORAGE_KEYS.selectedSection) as ConformitySectionId | null;
    if (storedSection && SECTIONS.some((s) => s.id === storedSection)) setSection(storedSection);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sidebarExpanded, String(expanded));
  }, [expanded]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.selectedSection, section);
  }, [section]);

  const filterType =
    section === "registre-licences"
      ? "licences"
      : section === "registre-rgpd"
        ? "rgpd"
        : section === "registre-bdd"
          ? "bdd"
          : null;

  return (
    <div className="grid min-h-[480px] flex-1 grid-cols-1 gap-0 overflow-hidden rounded-lg border border-border md:grid-cols-[auto_1fr]">
      <aside
        className={cn(
          "flex flex-col border-b border-border bg-muted/30 md:border-b-0 md:border-r",
          expanded ? "w-full md:w-[280px]" : "w-full md:w-12",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-2 py-2">
          {expanded && (
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Explorateur
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Replier la sidebar" : "Déplier la sidebar"}
          >
            {expanded ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto p-1">
          {(["registre", "droits"] as const).map((group) => (
            <div key={group} className="mb-2">
              {expanded && (
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  {group === "registre" ? "Registre S.I." : "Droits RGPD"}
                </p>
              )}
              {SECTIONS.filter((s) => s.group === group).map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    onClick={() => setSection(item.id)}
                    className={cn(
                      "mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                      active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {expanded && <span className="whitespace-normal break-words">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <main className="min-h-0 min-w-0 overflow-y-auto p-4">
        {filterType && (
          <RegistresManagement
            registres={initialRegistres}
            traitements={initialTraitements}
            defaultFilterType={filterType}
            canEdit={canEdit}
            canDelete={canDelete}
            onRegistresChange={onRegistresChange}
            onReload={onReload}
          />
        )}
        {section === "registre-traitement-data" && (
          <TraitementDataView
            traitements={initialTraitements}
            canEdit={canEdit}
            canDelete={canDelete}
            onTraitementsChange={onTraitementsChange}
            templateUrl={traitementDataTemplateUrl}
          />
        )}
        {section.startsWith("droit-") && (
          <DroitsRgpdPlaceholderView sectionId={section} canEdit={canEdit} />
        )}
      </main>
    </div>
  );
}
