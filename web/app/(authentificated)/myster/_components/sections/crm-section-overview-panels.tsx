"use client";

import { PRETEXT, PretextBlock } from "@/components/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type CrmOverviewDashPanels = {
  topPerformers: {
    userId: string;
    userName: string;
    transforme: number;
    rdvConfirme: number;
    total: number;
  }[];
  recontacts: {
    id: string;
    nom: string;
    prenom: string | null;
    email: string | null;
    entreprise: string | null;
    updatedAt: string;
  }[];
  upcomingSprints: {
    id: string;
    name: string;
    dateStart: string;
    dateEnd: string;
    isPublic: boolean;
  }[];
};

export function CrmSectionOverviewPanels(props: {
  dash: CrmOverviewDashPanels;
  onOpenSprint: (id: string) => void;
}) {
  const { dash, onOpenSprint } = props;

  return (
    <>
      <Card className="border-brand/15">
        <CardHeader className="border-b border-border/50 py-3 pb-2">
          <PretextBlock as="h3" metric={PRETEXT.smMedium} text="Top performers" />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead className="text-end">Transformés</TableHead>
                <TableHead className="text-end">RDV</TableHead>
                <TableHead className="text-end">Total assignés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dash.topPerformers.map((p) => (
                <TableRow key={p.userId}>
                  <TableCell>{p.userName}</TableCell>
                  <TableCell className="text-end">{p.transforme}</TableCell>
                  <TableCell className="text-end">{p.rdvConfirme}</TableCell>
                  <TableCell className="text-end">{p.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-2 lg:grid-cols-2">
        <Card className="border-brand/15">
          <CardHeader className="py-3">
            <PretextBlock as="h3" metric={PRETEXT.smMedium} text="Recontacts suggérés" />
            <PretextBlock
              as="p"
              metric={PRETEXT.xs}
              text="Statut « contacté », sans mise à jour depuis 7 jours."
              className="text-muted-foreground"
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {dash.recontacts.length === 0 ? (
              <div role="paragraph" className="text-muted-foreground text-sm">
                Aucun.
              </div>
            ) : (
              dash.recontacts.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-brand/10 bg-muted/20 px-3 py-2 text-sm"
                >
                  <div className="font-medium">
                    {r.prenom ? `${r.prenom} ` : ""}
                    {r.nom}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {r.email ?? "—"} · {r.entreprise ?? "—"}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-brand/15">
          <CardHeader className="py-3">
            <PretextBlock as="h3" metric={PRETEXT.smMedium} text="Sprints à venir" />
          </CardHeader>
          <CardContent className="space-y-2">
            {dash.upcomingSprints.length === 0 ? (
              <div role="paragraph" className="text-muted-foreground text-sm">
                Aucun.
              </div>
            ) : (
              dash.upcomingSprints.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="block w-full rounded-lg border border-brand/10 bg-muted/10 px-3 py-2 text-left text-sm transition-colors hover:bg-brand/10"
                  onClick={() => onOpenSprint(s.id)}
                >
                  <div className="font-medium">{s.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(s.dateStart).toLocaleDateString("fr-FR")} →{" "}
                    {new Date(s.dateEnd).toLocaleDateString("fr-FR")}
                    {s.isPublic ? " · public" : ""}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
