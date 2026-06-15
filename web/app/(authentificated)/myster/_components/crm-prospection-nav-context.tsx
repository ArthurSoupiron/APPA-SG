"use client";

import {
  readCrmProspectionNewSprint,
  readCrmProspectionSection,
  readCrmProspectionSprintId,
  writeCrmProspectionNewSprint,
  writeCrmProspectionSection,
  writeCrmProspectionSprintId,
} from "@myster/_lib/crm-prospection-storage";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { type CrmSectionId, isCrmSectionId } from "./crm-sections";

export type CrmProspectionNav = {
  activeSection: CrmSectionId;
  sprintId: string | null;
  newSprintOpen: boolean;
  setSection: (id: CrmSectionId) => void;
  openSprint: (id: string) => void;
  closeSprintView: () => void;
  openNewSprint: () => void;
  closeNewSprint: () => void;
};

type NavSnapshot = {
  activeSection: CrmSectionId;
  sprintId: string | null;
  newSprintOpen: boolean;
};

function readInitialNavSnapshot(
  defaultSection: CrmSectionId,
  allowedSectionIds: readonly CrmSectionId[],
): NavSnapshot {
  const allowedSet = new Set(allowedSectionIds);
  if (typeof window === "undefined") {
    return {
      activeSection: defaultSection,
      sprintId: null,
      newSprintOpen: false,
    };
  }

  const url = new URL(window.location.href);
  const q = url.searchParams.get("section");
  if (q && isCrmSectionId(q)) {
    if (allowedSet.has(q)) {
      writeCrmProspectionSection(q);
    }
    url.searchParams.delete("section");
    const qs = url.searchParams.toString();
    window.history.replaceState(null, "", `${url.pathname}${qs ? `?${qs}` : ""}`);
  }

  const fromSs = readCrmProspectionSection();
  let activeSection = defaultSection;
  if (fromSs && allowedSet.has(fromSs)) {
    activeSection = fromSs;
  } else {
    writeCrmProspectionSection(defaultSection);
  }

  return {
    activeSection,
    sprintId: readCrmProspectionSprintId(),
    newSprintOpen: readCrmProspectionNewSprint(),
  };
}

const CrmProspectionNavContext = createContext<CrmProspectionNav | null>(null);

export function useCrmProspectionNav(): CrmProspectionNav {
  const v = useContext(CrmProspectionNavContext);
  if (!v) {
    throw new Error("useCrmProspectionNav doit être utilisé dans CrmProspectionNavProvider");
  }
  return v;
}

type ProviderProps = {
  children: ReactNode;
  defaultSection: CrmSectionId;
  allowedSectionIds: readonly CrmSectionId[];
};

export function CrmProspectionNavProvider({
  children,
  defaultSection,
  allowedSectionIds,
}: ProviderProps) {
  const allowedSet = useMemo(() => new Set<CrmSectionId>(allowedSectionIds), [allowedSectionIds]);

  const [snap, setSnap] = useState<NavSnapshot>(() =>
    readInitialNavSnapshot(defaultSection, allowedSectionIds),
  );

  const { activeSection, sprintId, newSprintOpen } = snap;

  const setSection = useCallback(
    (id: CrmSectionId) => {
      if (!allowedSet.has(id)) return;
      writeCrmProspectionSection(id);
      setSnap((s) => ({ ...s, activeSection: id }));
    },
    [allowedSet],
  );

  const closeSprintView = useCallback(() => {
    writeCrmProspectionSprintId(null);
    setSnap((s) => ({ ...s, sprintId: null }));
  }, []);

  const openSprint = useCallback((id: string) => {
    writeCrmProspectionSection("sprints");
    writeCrmProspectionNewSprint(false);
    writeCrmProspectionSprintId(id);
    setSnap({
      activeSection: "sprints",
      sprintId: id,
      newSprintOpen: false,
    });
  }, []);

  const openNewSprint = useCallback(() => {
    writeCrmProspectionSection("sprints");
    writeCrmProspectionSprintId(null);
    writeCrmProspectionNewSprint(true);
    setSnap({
      activeSection: "sprints",
      sprintId: null,
      newSprintOpen: true,
    });
  }, []);

  const closeNewSprint = useCallback(() => {
    writeCrmProspectionNewSprint(false);
    setSnap((s) => ({ ...s, newSprintOpen: false }));
  }, []);

  const value = useMemo(
    (): CrmProspectionNav => ({
      activeSection,
      sprintId,
      newSprintOpen,
      setSection,
      openSprint,
      closeSprintView,
      openNewSprint,
      closeNewSprint,
    }),
    [
      activeSection,
      sprintId,
      newSprintOpen,
      setSection,
      openSprint,
      closeSprintView,
      openNewSprint,
      closeNewSprint,
    ],
  );

  return (
    <CrmProspectionNavContext.Provider value={value}>{children}</CrmProspectionNavContext.Provider>
  );
}
