"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUbacSession } from "@/lib/ubac-client";
import { cn } from "@/lib/utils";

type JobRow = {
  id: string;
  kind: string;
  status: string;
  progress: number | null;
  label: string | null;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
};

type BannerRow = {
  id: string;
  title: string;
  body: string;
  severity: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
};

type GwGroupPermRow = {
  id: string;
  email: string;
  name: string | null;
  syncedAt: string;
  permissions: string[];
};

type PermGroup = { key: string; permissions: string[] };

function groupCatalogByPrefix(catalog: string[]): PermGroup[] {
  const order: string[] = [];
  const map = new Map<string, string[]>();
  for (const p of catalog) {
    const i = p.indexOf(".");
    const key = i === -1 ? p : p.slice(0, i);
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(p);
  }
  return order.map((key) => ({ key, permissions: map.get(key)! }));
}

function permSuffix(permission: string) {
  const i = permission.indexOf(".");
  return i === -1 ? permission : permission.slice(i + 1);
}

export default function WorkspaceAdminPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: sessionLoading } = useUbacSession();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [groups, setGroups] = useState<
    { id: string; email: string; name: string | null; syncedAt: string }[]
  >([]);
  const [members, setMembers] = useState<
    {
      id: string;
      containerGroupId: string;
      memberKind: string;
      memberUserEmail: string | null;
      memberNestedGroupId: string | null;
    }[]
  >([]);
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [permCatalog, setPermCatalog] = useState<string[]>([]);
  const [groupPermRows, setGroupPermRows] = useState<GwGroupPermRow[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [draftGroupPerms, setDraftGroupPerms] = useState<Set<string>>(() => new Set());
  const [groupPermSaveBusy, setGroupPermSaveBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncBusy, setSyncBusy] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newSeverity, setNewSeverity] = useState("info");
  const [bannerBusy, setBannerBusy] = useState(false);

  const loadJobs = useCallback(async () => {
    const res = await fetch("/api/app/admin/gw/jobs", { credentials: "include" });
    if (!res.ok) return;
    const j: { jobs?: JobRow[] } = await res.json();
    setJobs(j.jobs ?? []);
  }, []);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/app/admin/gw/data", { credentials: "include" });
    if (!res.ok) return;
    const j: {
      groups?: typeof groups;
      members?: typeof members;
    } = await res.json();
    setGroups(j.groups ?? []);
    setMembers(j.members ?? []);
  }, []);

  const loadBanners = useCallback(async () => {
    const res = await fetch("/api/app/admin/banners", { credentials: "include" });
    if (!res.ok) return;
    const j: { banners?: BannerRow[] } = await res.json();
    setBanners(j.banners ?? []);
  }, []);

  const loadPermCatalog = useCallback(async () => {
    const res = await fetch("/api/app/ubac/catalog", { credentials: "include" });
    if (!res.ok) return;
    const j: { permissions?: string[] } = await res.json();
    setPermCatalog(j.permissions ?? []);
  }, []);

  const loadGroupPermissions = useCallback(async () => {
    const res = await fetch("/api/app/admin/gw/group-permissions", {
      credentials: "include",
    });
    if (!res.ok) return;
    const j: { groups?: GwGroupPermRow[] } = await res.json();
    setGroupPermRows(j.groups ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadJobs(),
        loadData(),
        loadBanners(),
        loadPermCatalog(),
        loadGroupPermissions(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadJobs, loadData, loadBanners, loadPermCatalog, loadGroupPermissions]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!isSuperAdmin) {
      router.replace("/account");
      return;
    }
    void loadAll();
  }, [sessionLoading, isSuperAdmin, router, loadAll]);

  useEffect(() => {
    if (groupPermRows.length === 0) {
      setSelectedGroupId("");
      return;
    }
    setSelectedGroupId((prev) =>
      prev && groupPermRows.some((g) => g.id === prev) ? prev : groupPermRows[0].id,
    );
  }, [groupPermRows]);

  useEffect(() => {
    if (!selectedGroupId) {
      setDraftGroupPerms(new Set());
      return;
    }
    const g = groupPermRows.find((x) => x.id === selectedGroupId);
    if (g) setDraftGroupPerms(new Set(g.permissions));
  }, [selectedGroupId, groupPermRows]);

  const onSync = async () => {
    setSyncBusy(true);
    try {
      const res = await fetch("/api/app/admin/gw/sync", {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 403) {
        toast.error("Accès refusé.");
        return;
      }
      if (!res.ok) {
        toast.error("Échec du lancement de la synchronisation.");
        return;
      }
      toast.success("Synchronisation lancée.");
      await loadJobs();
    } finally {
      setSyncBusy(false);
    }
  };

  const onCreateBanner = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error("Titre et message requis.");
      return;
    }
    setBannerBusy(true);
    try {
      const res = await fetch("/api/app/admin/banners", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          body: newBody.trim(),
          severity: newSeverity,
          isActive: true,
        }),
      });
      if (!res.ok) {
        toast.error("Création impossible.");
        return;
      }
      setNewTitle("");
      setNewBody("");
      toast.success("Annonce créée.");
      await loadBanners();
    } finally {
      setBannerBusy(false);
    }
  };

  const toggleBanner = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/app/admin/banners/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (!res.ok) {
      toast.error("Mise à jour impossible.");
      return;
    }
    await loadBanners();
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    const res = await fetch(`/api/app/admin/banners/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error("Suppression impossible.");
      return;
    }
    await loadBanners();
  };

  const selectedGroup = groupPermRows.find((g) => g.id === selectedGroupId);

  const toggleDraftPerm = (p: string, checked: boolean) => {
    setDraftGroupPerms((prev) => {
      const next = new Set(prev);
      if (checked) next.add(p);
      else next.delete(p);
      return next;
    });
  };

  const saveGroupPermissions = async () => {
    if (!selectedGroupId) {
      toast.error("Choisissez un groupe.");
      return;
    }
    setGroupPermSaveBusy(true);
    try {
      const res = await fetch(
        `/api/app/admin/gw/group-permissions/${encodeURIComponent(selectedGroupId)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            permissions: [...draftGroupPerms].sort(),
          }),
        },
      );
      if (!res.ok) {
        toast.error("Enregistrement impossible.");
        return;
      }
      toast.success("Permissions du groupe enregistrées.");
      await loadGroupPermissions();
    } finally {
      setGroupPermSaveBusy(false);
    }
  };

  const permGroups = groupCatalogByPrefix(permCatalog);

  if (sessionLoading || (!sessionLoading && !isSuperAdmin)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <main className="min-w-0 w-full space-y-8 px-3 py-6 sm:px-5 lg:px-6">
      <header className="space-y-2">
        <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Google Workspace" />
      </header>

      <Tabs defaultValue="sync" className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
          <TabsTrigger value="data">Données cache</TabsTrigger>
          <TabsTrigger value="group-perms">Permissions par groupe</TabsTrigger>
          <TabsTrigger value="banners">Annonces bandeau</TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div role="paragraph" className="font-medium">
                Synchronisation annuaire
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => void onSync()} disabled={syncBusy} className="gap-2">
                {syncBusy ? (
                  <>
                    <Spinner className="size-4" /> Lancement…
                  </>
                ) : (
                  "Lancer la synchronisation"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div role="paragraph" className="font-medium">
                Jobs récents
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Spinner className="size-6" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Progression</TableHead>
                      <TableHead>Début</TableHead>
                      <TableHead>Erreur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          Aucun job pour l’instant.
                        </TableCell>
                      </TableRow>
                    ) : (
                      jobs.map((j) => (
                        <TableRow key={j.id}>
                          <TableCell>{j.status}</TableCell>
                          <TableCell>{j.kind}</TableCell>
                          <TableCell>{j.progress != null ? `${j.progress}%` : "—"}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(j.startedAt).toLocaleString("fr-FR")}
                          </TableCell>
                          <TableCell className="max-w-md min-w-0 whitespace-normal break-words text-destructive text-xs [overflow-wrap:anywhere]">
                            {j.error ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div role="paragraph" className="font-medium">
                Groupes ({groups.length})
              </div>
            </CardHeader>
            <CardContent className="max-h-[280px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Id Google</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        Vide — lancez une synchronisation (compte Google admin Workspace lié, jetons
                        valides).
                      </TableCell>
                    </TableRow>
                  ) : (
                    groups.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell>{g.email}</TableCell>
                        <TableCell>{g.name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{g.id}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div role="paragraph" className="font-medium">
                Membres ({members.length})
              </div>
            </CardHeader>
            <CardContent className="max-h-[280px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conteneur</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email / sous-groupe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        Aucun membre en cache.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs">{m.containerGroupId}</TableCell>
                        <TableCell>{m.memberKind}</TableCell>
                        <TableCell>
                          {m.memberKind === "user"
                            ? (m.memberUserEmail ?? "—")
                            : (m.memberNestedGroupId ?? "—")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="group-perms" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div role="paragraph" className="font-medium">
                Permissions par groupe
              </div>
            </CardHeader>
            <CardContent className="min-w-0">
              {loading ? (
                <Spinner className="size-6" />
              ) : groupPermRows.length === 0 ? (
                <div role="paragraph" className="text-muted-foreground text-sm">
                  Aucun groupe en cache.
                </div>
              ) : (
                <div className="grid min-h-[min(480px,70vh)] gap-4 lg:grid-cols-[minmax(220px,280px)_1fr]">
                  <ScrollArea className="h-[min(480px,70vh)] rounded-md border lg:h-auto">
                    <div className="flex flex-col p-1">
                      {groupPermRows.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGroupId(g.id)}
                          className={cn(
                            "rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                            selectedGroupId === g.id && "bg-muted font-medium",
                          )}
                        >
                          <span className="block break-words [overflow-wrap:anywhere]">
                            {g.name ? `${g.email} — ${g.name}` : g.email}
                          </span>
                        </button>
                      ))}
                    </div>
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                  <div className="flex min-w-0 flex-col gap-3 rounded-md border p-3 lg:min-h-[min(480px,70vh)]">
                    {selectedGroup ? (
                      <>
                        <div role="paragraph" className="text-muted-foreground text-xs">
                          Sync : {new Date(selectedGroup.syncedAt).toLocaleString("fr-FR")} ·{" "}
                          {selectedGroup.permissions.length} en base
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setDraftGroupPerms(new Set(permCatalog))}
                          >
                            Toutes les permissions
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setDraftGroupPerms(new Set())}
                          >
                            Aucune
                          </Button>
                          {permGroups.map((section) => (
                            <Button
                              key={section.key}
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDraftGroupPerms((prev) => {
                                  const next = new Set(prev);
                                  for (const p of section.permissions) next.add(p);
                                  return next;
                                })
                              }
                            >
                              Tout · {section.key}
                            </Button>
                          ))}
                        </div>
                        <ScrollArea className="min-h-0 flex-1 rounded-md border p-3">
                          <div className="space-y-6 pr-3">
                            {permGroups.map((section) => (
                              <div key={section.key} className="space-y-2">
                                <div role="paragraph" className="font-medium text-sm capitalize">
                                  {section.key}
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {section.permissions.map((p) => {
                                    const permId = `perm-${p}`;
                                    return (
                                      <div
                                        key={p}
                                        className="flex cursor-pointer items-start gap-2 text-sm"
                                      >
                                        <Checkbox
                                          id={permId}
                                          checked={draftGroupPerms.has(p)}
                                          onCheckedChange={(v) => toggleDraftPerm(p, v === true)}
                                          className="mt-0.5"
                                        />
                                        <Label htmlFor={permId} className="font-mono text-xs">
                                          {permSuffix(p)}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                          <ScrollBar orientation="vertical" />
                        </ScrollArea>
                        <Button
                          onClick={() => void saveGroupPermissions()}
                          disabled={groupPermSaveBusy}
                          className="w-fit gap-2"
                        >
                          {groupPermSaveBusy ? <Spinner className="size-4" /> : null}
                          Enregistrer
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div role="paragraph" className="font-medium">
                Nouvelle annonce
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="bn-title">Titre</Label>
                <Input
                  id="bn-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex. Maintenance prévue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bn-body">Message</Label>
                <Textarea
                  id="bn-body"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bn-severity">Sévérité</Label>
                <Select value={newSeverity} onValueChange={setNewSeverity}>
                  <SelectTrigger id="bn-severity" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Avertissement</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => void onCreateBanner()} disabled={bannerBusy} className="gap-2">
                {bannerBusy ? <Spinner className="size-4" /> : null}
                Créer l’annonce
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div role="paragraph" className="font-medium">
                Annonces existantes
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actif</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Sévérité</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        Aucune annonce.
                      </TableCell>
                    </TableRow>
                  ) : (
                    banners.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={b.isActive}
                              onCheckedChange={() => void toggleBanner(b.id, b.isActive)}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{b.title}</span>
                          <div
                            role="paragraph"
                            className="text-muted-foreground text-xs whitespace-normal break-words [overflow-wrap:anywhere]"
                          >
                            {b.body}
                          </div>
                        </TableCell>
                        <TableCell>{b.severity}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => void deleteBanner(b.id)}
                          >
                            Supprimer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
