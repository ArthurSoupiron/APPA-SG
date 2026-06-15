import { CRM_SECTEUR_FILTER_ALL } from "@myster/_lib/crm-secteurs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  sprintDetailAddMembers,
  sprintDetailAddPickedProspects,
  sprintDetailDeleteSprint,
  sprintDetailLoadProspectsForPick,
  sprintDetailMemberIds,
  sprintDetailOpenEditSprint,
  sprintDetailRemoveMember,
  sprintDetailSaveEditSprint,
  sprintDetailUserOptions,
} from "./crm-sprint-detail-async-members-sprint";
import {
  sprintDetailOnImportFile,
  sprintDetailOpenFiche,
  sprintDetailPatchProspect,
  sprintDetailRandomAssignAmongMembers,
  sprintDetailRunBulkAssign,
  sprintDetailSaveFiche,
} from "./crm-sprint-detail-async-prospects-fiche";
import type {
  FicheFormState,
  Member,
  ProspectOpt,
  SpRow,
  UserOpt,
} from "./crm-sprint-detail-types";
import { emptyFicheForm } from "./crm-sprint-detail-types";

export function useCrmSprintDetail(
  sprintId: string,
  onBack: () => void,
  currentUserId: string | undefined,
) {
  const id = sprintId;

  const [loading, setLoading] = useState(true);
  const [sprint, setSprint] = useState<{
    id: string;
    name: string;
    theme: string | null;
    isPublic: boolean;
    dateStart: string | null;
    dateEnd: string | null;
    isManager?: boolean;
  } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [prospects, setProspects] = useState<SpRow[]>([]);
  const [allUsers, setAllUsers] = useState<UserOpt[]>([]);
  const [addMemberId, setAddMemberId] = useState("");
  const [pickOpen, setPickOpen] = useState(false);
  const [pickSecteur, setPickSecteur] = useState(CRM_SECTEUR_FILTER_ALL);
  const [allProspects, setAllProspects] = useState<ProspectOpt[]>([]);
  const [pickIds, setPickIds] = useState<Set<string>>(new Set());
  const [pickDefaultAssignee, setPickDefaultAssignee] = useState("");
  const [importAssigneeId, setImportAssigneeId] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTheme, setEditTheme] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editPublic, setEditPublic] = useState(true);
  const [editBusy, setEditBusy] = useState(false);
  const [selectedBulk, setSelectedBulk] = useState<Set<string>>(new Set());
  const [bulkAssignTo, setBulkAssignTo] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [randomBusy, setRandomBusy] = useState(false);
  const [ficheOpen, setFicheOpen] = useState(false);
  const [ficheRow, setFicheRow] = useState<SpRow | null>(null);
  const [ficheForm, setFicheForm] = useState<FicheFormState>(emptyFicheForm);
  const [ficheLoading, setFicheLoading] = useState(false);
  const [ficheSaving, setFicheSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/app/crm/sprints/${encodeURIComponent(id)}`, {
        credentials: "include",
      });
      if (res.status === 403 || res.status === 404) {
        toast.error("Sprint introuvable ou accès refusé.");
        setSprint(null);
        return;
      }
      if (!res.ok) {
        toast.error("Chargement impossible.");
        return;
      }
      const json: {
        sprint?: {
          id: string;
          name: string;
          theme: string | null;
          isPublic: boolean;
          dateStart: string | null;
          dateEnd: string | null;
          isManager?: boolean;
        };
        members?: Member[];
        prospects?: SpRow[];
        allUsers?: UserOpt[];
      } = await res.json();
      if (json.sprint) setSprint(json.sprint);
      setMembers(json.members ?? []);
      setProspects(json.prospects ?? []);
      setAllUsers(json.allUsers ?? []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadProspectsForPick = useCallback(
    async (secteurFilter: string) => {
      await sprintDetailLoadProspectsForPick(
        id,
        secteurFilter,
        CRM_SECTEUR_FILTER_ALL,
        setAllProspects,
      );
    },
    [id],
  );

  const addMembers = useCallback(async () => {
    await sprintDetailAddMembers(id, addMemberId, load, setAddMemberId);
  }, [id, addMemberId, load]);

  const removeMember = useCallback(
    async (uid: string) => {
      await sprintDetailRemoveMember(id, uid, load);
    },
    [id, load],
  );

  const patchProspect = useCallback(
    async (
      prospectId: string,
      body: Record<string, unknown>,
      opts?: { silent?: boolean; skipReload?: boolean },
    ) => sprintDetailPatchProspect(id, prospectId, body, load, opts),
    [id, load],
  );

  const openEditSprint = useCallback(() => {
    if (!sprint) return;
    sprintDetailOpenEditSprint(
      sprint,
      setEditName,
      setEditTheme,
      setEditStart,
      setEditEnd,
      setEditPublic,
      setEditOpen,
    );
  }, [sprint]);

  const saveEditSprint = useCallback(async () => {
    await sprintDetailSaveEditSprint(
      id,
      editName,
      editTheme,
      editStart,
      editEnd,
      editPublic,
      setEditBusy,
      setEditOpen,
      load,
    );
  }, [id, editName, editTheme, editStart, editEnd, editPublic, load]);

  const runBulkAssign = useCallback(
    async (userId: string | null, ids: string[]) => {
      await sprintDetailRunBulkAssign(
        id,
        userId,
        ids,
        load,
        setSelectedBulk,
        setBulkBusy,
        patchProspect,
      );
    },
    [id, load, patchProspect],
  );

  const randomAssignAmongMembers = useCallback(
    async (scope: "unassigned" | "all") => {
      await sprintDetailRandomAssignAmongMembers(id, members, scope, load, setRandomBusy);
    },
    [id, members, load],
  );

  const openFiche = useCallback(async (p: SpRow) => {
    await sprintDetailOpenFiche(p, setFicheRow, setFicheOpen, setFicheLoading, setFicheForm);
  }, []);

  const saveFiche = useCallback(async () => {
    if (!ficheRow || !id) return;
    await sprintDetailSaveFiche(
      id,
      ficheRow,
      Boolean(sprint?.isManager),
      currentUserId,
      ficheForm,
      load,
      setFicheSaving,
      setFicheOpen,
      setFicheRow,
    );
  }, [id, ficheRow, sprint?.isManager, currentUserId, ficheForm, load]);

  const addPickedProspects = useCallback(async () => {
    await sprintDetailAddPickedProspects(
      id,
      pickIds,
      pickDefaultAssignee,
      setPickIds,
      setPickDefaultAssignee,
      setPickOpen,
      load,
    );
  }, [id, pickIds, pickDefaultAssignee, load]);

  const onImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      await sprintDetailOnImportFile(id, file, importAssigneeId, load, setImportBusy);
    },
    [id, importAssigneeId, load],
  );

  const deleteSprint = useCallback(async () => {
    await sprintDetailDeleteSprint(id, onBack);
  }, [id, onBack]);

  const memberIds = useMemo(() => sprintDetailMemberIds(members), [members]);
  const userOptions = useMemo(
    () => sprintDetailUserOptions(allUsers, memberIds),
    [allUsers, memberIds],
  );

  return {
    id,
    loading,
    sprint,
    members,
    prospects,
    allUsers,
    addMemberId,
    setAddMemberId,
    pickOpen,
    setPickOpen,
    pickSecteur,
    setPickSecteur,
    allProspects,
    pickIds,
    setPickIds,
    pickDefaultAssignee,
    setPickDefaultAssignee,
    importAssigneeId,
    setImportAssigneeId,
    importBusy,
    editOpen,
    setEditOpen,
    editName,
    setEditName,
    editTheme,
    setEditTheme,
    editStart,
    setEditStart,
    editEnd,
    setEditEnd,
    editPublic,
    setEditPublic,
    editBusy,
    selectedBulk,
    setSelectedBulk,
    bulkAssignTo,
    setBulkAssignTo,
    bulkBusy,
    randomBusy,
    ficheOpen,
    setFicheOpen,
    ficheRow,
    setFicheRow,
    ficheForm,
    setFicheForm,
    ficheLoading,
    ficheSaving,
    load,
    loadProspectsForPick,
    addMembers,
    removeMember,
    patchProspect,
    openEditSprint,
    saveEditSprint,
    runBulkAssign,
    randomAssignAmongMembers,
    openFiche,
    saveFiche,
    addPickedProspects,
    onImportFile,
    deleteSprint,
    memberIds,
    userOptions,
  };
}
