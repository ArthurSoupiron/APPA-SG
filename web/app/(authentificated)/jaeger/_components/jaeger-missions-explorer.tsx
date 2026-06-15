"use client";

import {
  FileStack,
  FileText,
  MessageSquare,
  Settings2,
  Shield,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { PRETEXT, PretextBlock } from "@/components/typography";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUbacSession } from "@/lib/ubac-client";
import { cn } from "@/lib/utils";

import {
  fetchIntervenantOptions,
  fetchMissionFormOptions,
  fetchMissionPermissions,
  fetchMissionsKpi,
  fetchMissionsList,
  fetchSlackGroupOptions,
  hydrateMissionsDocsMatrices,
} from "../_lib/missions-api";
import {
  buildMissionPermissionsFromUbac,
  mergeMissionPermissions,
} from "../_lib/missions-permissions";
import { gestionnaireMissionsStyles as gm, jaegerExplorerStyles as styles } from "../_lib/gestionnaire-missions.styles";
import type { GestionnaireMissionsPermissions, MissionRow } from "../_lib/missions-types";
import { ConfigView } from "./config-view";
import { KpiView } from "./kpi-view";
import { MissionDetailView } from "./mission-detail-view";
import { MissionJournalView } from "./mission-journal-view";
import { MissionWorkflowView } from "./mission-workflow-view";
import { MissionsView } from "./missions-view";

type TabKey = "missions" | "kpi" | "config";
type MissionSectionKey = "details" | "workflow" | "journal";
type ConfigSectionKey = "slack" | "template" | "permissions";

type MatrixHydrationEntry = {
  bcIdsKey: string;
  missionLevelDocs: MissionRow["missionLevelDocs"];
  bcDocsMatrixRows: MissionRow["bcDocsMatrixRows"];
};

const MAIN_TABS: Array<{ key: TabKey; label: string }> = [
  { key: "missions", label: "Missions" },
  { key: "kpi", label: "KPI" },
  { key: "config", label: "Config" },
];

const tabPanelClass =
  "mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-2 outline-none";

export function JaegerMissionsExplorer() {
  const queryClient = useQueryClient();
  const { hasPermission, loading: sessionLoading } = useUbacSession();

  const fallbackPermissions = useMemo(
    () => buildMissionPermissionsFromUbac(hasPermission),
    [hasPermission],
  );

  const bootstrapQuery = useQuery({
    queryKey: ["jaeger-missions-bootstrap"],
    queryFn: async () => {
      const [missions, kpi, options, slackGroups, remotePermissions, intervenants] =
        await Promise.all([
          fetchMissionsList(),
          fetchMissionsKpi(),
          fetchMissionFormOptions(),
          fetchSlackGroupOptions(),
          fetchMissionPermissions(),
          fetchIntervenantOptions(),
        ]);
      return {
        missions,
        kpi,
        options: options ?? { clients: [], entreprises: [], cdps: [] },
        slackGroups,
        permissions: mergeMissionPermissions(remotePermissions, fallbackPermissions),
        intervenants,
      };
    },
    enabled: !sessionLoading,
  });

  const permissions: GestionnaireMissionsPermissions =
    bootstrapQuery.data?.permissions ?? fallbackPermissions;

  const reloadAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["jaeger-missions-bootstrap"] });
  };

  const [matrixById, setMatrixById] = useState<Record<string, MatrixHydrationEntry>>({});
  const missions = bootstrapQuery.data?.missions ?? [];
  const missionsStructureKey = useMemo(
    () =>
      missions
        .map((m) => `${m.id}:${m.bcSummaries.map((b) => b.bcId).join(",")}`)
        .join("|"),
    [missions],
  );
  const hydrationAttempted = useRef(new Set<string>());
  const hydrationAttemptedStructureKey = useRef("");

  const missionsState = useMemo(() => {
    return missions.map((m) => {
      const bcIdsKey = m.bcSummaries.map((b) => b.bcId).join(",");
      const h = matrixById[m.id];
      const matrixMatches =
        h &&
        h.bcIdsKey === bcIdsKey &&
        h.missionLevelDocs != null &&
        (m.bcSummaries.length === 0 || h.bcDocsMatrixRows.length === m.bcSummaries.length);
      if (matrixMatches && h) {
        return {
          ...m,
          missionLevelDocs: h.missionLevelDocs,
          bcDocsMatrixRows: h.bcDocsMatrixRows,
        };
      }
      return { ...m, missionLevelDocs: null, bcDocsMatrixRows: [] };
    });
  }, [missions, matrixById]);

  useEffect(() => {
    if (hydrationAttemptedStructureKey.current !== missionsStructureKey) {
      hydrationAttempted.current = new Set();
      hydrationAttemptedStructureKey.current = missionsStructureKey;
    }
    const pending = missionsState.filter((m) => {
      const incomplete =
        m.missionLevelDocs == null ||
        (m.bcSummaries.length > 0 && m.bcDocsMatrixRows.length === 0);
      return incomplete && !hydrationAttempted.current.has(m.id);
    });
    const pendingIds = pending.map((m) => m.id);
    if (pendingIds.length === 0) return;

    const bcKeysById = new Map(
      pending.map((m) => [m.id, m.bcSummaries.map((b) => b.bcId).join(",")]),
    );
    for (const id of pendingIds) hydrationAttempted.current.add(id);

    let cancelled = false;
    void hydrateMissionsDocsMatrices(pendingIds)
      .then((slices) => {
        if (cancelled) return;
        setMatrixById((prev) => {
          const next = { ...prev };
          for (const s of slices) {
            const bcIdsKey = bcKeysById.get(s.missionId);
            if (bcIdsKey === undefined) continue;
            next[s.missionId] = {
              bcIdsKey,
              missionLevelDocs: s.missionLevelDocs,
              bcDocsMatrixRows: s.bcDocsMatrixRows,
            };
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) {
          for (const id of pendingIds) hydrationAttempted.current.delete(id);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [missionsState, missionsStructureKey]);

  const [activeTab, setActiveTab] = useState<TabKey>("missions");
  const [activeConfigSection, setActiveConfigSection] = useState<ConfigSectionKey>("slack");
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [activeMissionSection, setActiveMissionSection] = useState<MissionSectionKey>("details");
  const [workflowActionRequest, setWorkflowActionRequest] = useState<
    "create-bc" | "focus-events" | null
  >(null);
  const [workflowSelectedBcId, setWorkflowSelectedBcId] = useState<string | null>(null);
  const [missionBcList, setMissionBcList] = useState<Array<{ id: string; label: string }>>([]);

  const selectedMission = useMemo(
    () => missionsState.find((m) => m.id === selectedMissionId) ?? null,
    [missionsState, selectedMissionId],
  );

  const showMissionSections = activeTab === "missions" && Boolean(selectedMission);
  const showWorkflowBcShortcuts = showMissionSections && activeMissionSection === "workflow";
  const displayedMissionBcList = showWorkflowBcShortcuts ? missionBcList : [];

  if (sessionLoading || bootstrapQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!hasPermission("erp.read")) {
    return (
      <Empty className="min-h-[40vh]">
        <EmptyHeader>
          <EmptyDescription>
            Permission erp.read requise pour accéder au gestionnaire de missions.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (bootstrapQuery.isError || !bootstrapQuery.data) {
    return (
      <Empty className="min-h-[40vh]">
        <EmptyHeader>
          <EmptyDescription>
            Impossible de charger le gestionnaire de missions. Vérifiez que l&apos;API
            /api/app/missions est disponible.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const { kpi, options, slackGroups, intervenants } = bootstrapQuery.data;

  return (
    <div className={cn(styles.shell, gm.shell, "px-3 py-2 sm:px-4")}>
      <PretextBlock
        as="h1"
        metric={PRETEXT.h1Page}
        text="Gestionnaire de missions"
        className="mb-2 shrink-0"
      />

      {selectedMission && activeTab === "missions" ? (
        <div className="mb-2 rounded-sm border border-slate-300/85 bg-slate-50/70 px-3 py-2 text-center dark:border-white/8 dark:bg-background/60">
          <p className="text-sm font-medium whitespace-normal wrap-anywhere">
            {selectedMission.missionName}
          </p>
          <p className="text-xs text-muted-foreground whitespace-normal wrap-anywhere">
            Client: {selectedMission.clientName ?? "N/A"} | Entreprise:{" "}
            {selectedMission.entrepriseName ?? "N/A"} | CDP:{" "}
            {selectedMission.cdpName ?? "N/A"}
          </p>
        </div>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as TabKey);
          if (v !== "missions") setSelectedMissionId(null);
        }}
        className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-0"
      >
        <TabsList
          variant="line"
          aria-label="Sections gestionnaire missions"
          className="mb-0 h-auto w-full min-w-0 shrink-0 flex-wrap justify-start gap-x-0 gap-y-0 rounded-none border-0 border-b border-border bg-transparent p-0"
        >
          {MAIN_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="shrink-0">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {showMissionSections ? (
          <div
            role="tablist"
            aria-label="Sections mission"
            className="mt-1 flex flex-wrap gap-1 border-b border-border pb-2"
          >
            <button
              type="button"
              onClick={() => setSelectedMissionId(null)}
              className="border border-slate-300/85 px-2 py-1 text-xs dark:border-white/8"
            >
              ← Retour liste
            </button>
            {(
              [
                { key: "details", label: "Détails" },
                { key: "workflow", label: "Workflow docs" },
                { key: "journal", label: "Journal" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={activeMissionSection === item.key}
                onClick={() => setActiveMissionSection(item.key)}
                className={cn(
                  "border px-2 py-1 text-xs",
                  activeMissionSection === item.key
                    ? "border-amber-300 bg-amber-100 dark:border-amber-400/45 dark:bg-amber-500/14"
                    : "border-slate-300/85 dark:border-white/8",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        <TabsContent value="missions" className={tabPanelClass}>
          {!selectedMission ? (
            <MissionsView
              missions={missionsState}
              options={options}
              onSelectMission={setSelectedMissionId}
              selectedMissionId={selectedMissionId}
              permissions={permissions}
              onRefresh={reloadAll}
            />
          ) : activeMissionSection === "details" ? (
            <MissionDetailView
              key={selectedMission.id}
              mission={selectedMission}
              permissions={permissions}
              onRefresh={reloadAll}
            />
          ) : activeMissionSection === "workflow" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">
              {showWorkflowBcShortcuts ? (
                <aside className="flex shrink-0 flex-wrap gap-1 lg:w-48 lg:flex-col">
                  <button
                    type="button"
                    disabled={!permissions.canManageBcStructure}
                    onClick={() => {
                      setActiveMissionSection("workflow");
                      setWorkflowActionRequest("create-bc");
                    }}
                    className="border border-slate-300/85 px-2 py-1 text-xs dark:border-white/8"
                  >
                    + Nouveau BC
                  </button>
                  {displayedMissionBcList.map((bc) => (
                    <button
                      key={bc.id}
                      type="button"
                      onClick={() => {
                        setActiveMissionSection("workflow");
                        setWorkflowSelectedBcId(bc.id);
                      }}
                      className={cn(
                        "border px-2 py-1 text-left text-xs whitespace-normal wrap-anywhere",
                        workflowSelectedBcId === bc.id
                          ? "border-amber-300 bg-amber-100 dark:border-amber-400/45 dark:bg-amber-500/14"
                          : "border-slate-300/85 dark:border-white/8",
                      )}
                    >
                      {bc.label}
                    </button>
                  ))}
                </aside>
              ) : null}
              <div className="min-w-0 flex-1">
                <MissionWorkflowView
                  key={selectedMission.id}
                  missionId={selectedMission.id}
                  permissions={permissions}
                  actionRequest={workflowActionRequest}
                  selectedBcIdRequest={workflowSelectedBcId}
                  onActionConsumed={() => setWorkflowActionRequest(null)}
                  prefetchedDocsMatrix={{
                    mission: selectedMission.missionLevelDocs,
                    rows: selectedMission.bcDocsMatrixRows,
                    expectedBcCount: selectedMission.bcSummaries.length,
                  }}
                  onBcListReady={setMissionBcList}
                  initialIntervenantOptions={intervenants}
                />
              </div>
            </div>
          ) : (
            <MissionJournalView missionId={selectedMission.id} />
          )}
        </TabsContent>

        <TabsContent value="kpi" className={tabPanelClass}>
          {kpi ? <KpiView kpi={kpi} /> : null}
        </TabsContent>

        <TabsContent value="config" className={tabPanelClass}>
          <div className="mb-2 flex flex-wrap gap-1">
            {(
              [
                { key: "slack", label: "Slack", icon: MessageSquare },
                { key: "template", label: "Templates Drive", icon: FileText },
                { key: "permissions", label: "Permissions", icon: Shield },
              ] as const
            ).map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveConfigSection(section.key)}
                className={cn(
                  "inline-flex items-center gap-1 border px-2 py-1 text-xs",
                  activeConfigSection === section.key
                    ? "border-amber-300 bg-amber-100 dark:border-amber-400/45 dark:bg-amber-500/14"
                    : "border-slate-300/85 dark:border-white/8",
                )}
              >
                <section.icon className="h-3.5 w-3.5" />
                {section.label}
              </button>
            ))}
          </div>
          <ConfigView
            groups={slackGroups}
            permissions={permissions}
            activeSection={activeConfigSection}
            onRefresh={reloadAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
