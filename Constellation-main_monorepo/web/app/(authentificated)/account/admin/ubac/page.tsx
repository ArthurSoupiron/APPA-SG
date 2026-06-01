"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type UbacAdminUserRow, useUbacSession } from "@/lib/ubac-client";

function permBadgeLabel(p: string) {
  return p.replace(/\./g, "·");
}

function matchesSearch(haystack: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}

function cloneUserRow(u: UbacAdminUserRow): UbacAdminUserRow {
  return {
    ...u,
    workspaceGroups: u.workspaceGroups.map((g) => ({ ...g })),
    groupPermissions: [...u.groupPermissions],
    effectivePermissions: [...u.effectivePermissions],
    isSuperAdmin: u.isSuperAdmin,
  };
}

export default function UbacAdminPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: sessionLoading } = useUbacSession();
  const [users, setUsers] = useState<UbacAdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMembers, setSearchMembers] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const usersRes = await fetch("/api/app/ubac/users", {
        credentials: "include",
      });
      if (!usersRes.ok) {
        toast.error("Chargement impossible.");
        return;
      }
      const usersJson: { users?: UbacAdminUserRow[] } = await usersRes.json();
      const usersRaw = usersJson.users ?? [];
      setUsers(
        usersRaw.map((row) =>
          cloneUserRow({
            ...row,
            workspaceGroups: row.workspaceGroups ?? [],
            groupPermissions: row.groupPermissions ?? [],
            effectivePermissions: row.effectivePermissions ?? [],
          }),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!isSuperAdmin) {
      router.replace("/account");
      return;
    }
    void load();
  }, [sessionLoading, isSuperAdmin, router, load]);

  const filteredUsers = useMemo(() => {
    const q = searchMembers.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const groupLabel = u.workspaceGroups.map((g) => `${g.email} ${g.name ?? ""}`).join(" ");
      return matchesSearch(u.name, q) || matchesSearch(u.email, q) || matchesSearch(groupLabel, q);
    });
  }, [users, searchMembers]);

  if (sessionLoading || (!sessionLoading && !isSuperAdmin)) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center px-4">
        <Spinner className="size-8" />
      </main>
    );
  }

  return (
    <main className="min-w-0 w-full space-y-8 px-3 py-6 sm:px-5 lg:px-6">
      <header className="space-y-2">
        <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Membres et accès" />
      </header>

      <Card className="min-w-0 overflow-x-auto overflow-y-visible rounded-xl border-border/60 bg-background shadow-none">
        <CardHeader className="border-b border-border/60 bg-transparent px-6 py-5">
          <PretextBlock as="h2" metric={PRETEXT.smMedium} text="Membres" />
        </CardHeader>
        <CardContent className="min-w-0 p-0">
          <div className="space-y-3 border-b border-border/60 bg-muted/20 px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2 sm:max-w-md">
                <Label htmlFor="search-members" className="sr-only">
                  Rechercher
                </Label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="search-members"
                    value={searchMembers}
                    onChange={(e) => setSearchMembers(e.target.value)}
                    placeholder="Rechercher…"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end border-b border-border/60 px-6 py-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              Actualiser
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="size-8" />
            </div>
          ) : (
            <Table className="w-full min-w-0 table-auto">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[10rem] px-4 py-3 align-bottom sm:px-6">
                    <PretextBlock
                      as="span"
                      metric={PRETEXT.xs}
                      text="Nom"
                      className="font-medium text-muted-foreground uppercase tracking-wide"
                    />
                  </TableHead>
                  <TableHead className="min-w-[12rem] px-2 py-3 align-bottom sm:px-3">
                    <PretextBlock
                      as="span"
                      metric={PRETEXT.xs}
                      text="E-mail"
                      className="font-medium text-muted-foreground uppercase tracking-wide"
                    />
                  </TableHead>
                  <TableHead className="min-w-[14rem] px-2 py-3 align-bottom sm:px-3">
                    <PretextBlock
                      as="span"
                      metric={PRETEXT.xs}
                      text="Groupes Google"
                      className="font-medium text-muted-foreground uppercase tracking-wide"
                    />
                  </TableHead>
                  <TableHead className="min-w-[16rem] px-2 py-3 align-bottom sm:px-3">
                    <PretextBlock
                      as="span"
                      metric={PRETEXT.xs}
                      text="Droits effectifs"
                      className="font-medium text-muted-foreground uppercase tracking-wide"
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="min-w-0 px-4 align-top sm:px-6">
                      <div className="space-y-2">
                        <span className="font-medium break-words [overflow-wrap:anywhere]">
                          {u.name}
                        </span>
                        {u.isSuperAdmin ? (
                          <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2">
                            <PretextBlock
                              as="p"
                              metric={PRETEXT.xs}
                              text="Super-admin"
                              className="font-semibold text-amber-950 uppercase tracking-wide dark:text-amber-100"
                            />
                            <PretextBlock
                              as="p"
                              metric={PRETEXT.sm}
                              text="Tous les droits (super-admin)."
                              className="mt-1 text-pretty leading-relaxed text-amber-950/90 [overflow-wrap:anywhere] dark:text-amber-50/90"
                            />
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0 px-2 align-top text-muted-foreground text-sm sm:px-3">
                      <span className="break-words [overflow-wrap:anywhere]">{u.email}</span>
                    </TableCell>
                    <TableCell className="min-w-0 align-top px-2 sm:px-3">
                      {u.workspaceGroups.length === 0 ? (
                        <PretextBlock
                          as="p"
                          metric={PRETEXT.micro}
                          text="—"
                          className="text-muted-foreground"
                        />
                      ) : (
                        <div className="flex min-w-0 flex-wrap content-start gap-1.5">
                          {u.workspaceGroups.map((g) => (
                            <Badge
                              key={g.id}
                              variant="secondary"
                              className="h-auto min-w-0 max-w-full whitespace-normal py-1 text-left font-normal [overflow-wrap:anywhere]"
                            >
                              <span className="block break-words">
                                {g.name ? `${g.email} — ${g.name}` : g.email}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="min-w-0 align-top px-2 sm:px-3">
                      {u.effectivePermissions.length === 0 ? (
                        <PretextBlock
                          as="span"
                          metric={PRETEXT.xs}
                          text="—"
                          className="text-muted-foreground"
                        />
                      ) : (
                        <div className="flex min-w-0 flex-wrap content-start gap-1">
                          {u.effectivePermissions.map((p) => (
                            <Badge
                              key={p}
                              variant="outline"
                              className="h-auto min-w-0 max-w-full whitespace-normal py-1 text-left font-normal [overflow-wrap:anywhere]"
                            >
                              {permBadgeLabel(p)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filteredUsers.length === 0 && users.length > 0 ? (
            <div className="px-6 py-8">
              <PretextBlock
                as="p"
                metric={PRETEXT.sm}
                text="Aucun membre ne correspond à la recherche."
                className="text-muted-foreground"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
