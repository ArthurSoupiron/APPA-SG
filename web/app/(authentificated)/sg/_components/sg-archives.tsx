"use client";

import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { uploadSgFileToDrive } from "../_lib/sg-api";
import { useSgBase } from "../_lib/sg-base";
import { useSg } from "../_lib/sg-store";
import { buildMembersCsv, exportMembersCSV } from "../_lib/sg-utils";
import type { Member } from "../_lib/sg-types";
import { SgAvatar, StatusBadge } from "./sg-bits";

export function SgArchives() {
  const { data } = useSg();
  const base = useSgBase();

  // Membres alumni / inactifs, regroupés par promotion
  const archived = data.members.filter((m) => m.status === "alumni" || m.status === "inactive");
  const byPromo = new Map<number, Member[]>();
  for (const m of archived) {
    const list = byPromo.get(m.promo) ?? [];
    list.push(m);
    byPromo.set(m.promo, list);
  }
  const promos = [...byPromo.keys()].sort((a, b) => b - a);

  // Tous les mandats clôturés (non courants), tous membres confondus
  const pastMandates: { m: Member; role: string; period: string }[] = [];
  for (const m of data.members) {
    for (const md of m.mandates ?? []) {
      if (!md.current) pastMandates.push({ m, role: md.role, period: md.period });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {archived.length} membre(s) archivé(s) · {pastMandates.length} mandat(s) passé(s)
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportMembersCSV(data)}>
            Exporter l&apos;annuaire
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const up = await uploadSgFileToDrive("annuaire-jeece-sg.csv", buildMembersCsv(data));
              up ? toast.success("Annuaire exporté vers Drive") : toast.error("Export Drive impossible (Drive lié ?).");
            }}
          >
            Exporter vers Drive
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Alumni par promo */}
        <div className="space-y-4">
          {promos.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="font-medium">Aucun membre archivé</p>
                <p className="text-sm text-muted-foreground">Les alumni et inactifs apparaîtront ici.</p>
              </CardContent>
            </Card>
          )}
          {promos.map((p) => {
            const list = byPromo.get(p) ?? [];
            return (
              <Card key={p}>
                <CardHeader className="flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">Promotion {p}</CardTitle>
                    <p className="text-xs text-muted-foreground">{list.length} membre(s)</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {list.map((m) => (
                    <Link
                      key={m.id}
                      href={`${base}/membres/${m.id}`}
                      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
                    >
                      <SgAvatar member={m} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {m.first} {m.last}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {m.role} · {m.pole}
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Historique des mandats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique des mandats</CardTitle>
            <p className="text-xs text-muted-foreground">Tous pôles · mandats clôturés</p>
          </CardHeader>
          <CardContent className="space-y-1">
            {pastMandates.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                Aucun mandat passé. Clôturez un mandat depuis une fiche membre.
              </p>
            )}
            {pastMandates.map(({ m, role, period }, i) => (
              <Link
                key={`${m.id}-${i}`}
                href={`${base}/membres/${m.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
              >
                <SgAvatar member={m} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{role}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {m.first} {m.last} · {period}
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
