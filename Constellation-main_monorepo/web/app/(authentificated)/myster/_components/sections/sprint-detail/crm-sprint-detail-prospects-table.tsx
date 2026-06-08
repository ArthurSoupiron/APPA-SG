import {
  CRM_PROSPECT_STATUSES,
  CRM_PROSPECT_STATUT_LABELS,
  CRM_STATUT_BADGE_CLASS,
  CRM_STATUT_ROW_ACCENT,
  type CrmProspectStatut,
} from "@myster/_lib/crm-statuts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { Member, SpRow } from "./crm-sprint-detail-types";

export function CrmSprintDetailProspectsTable(props: {
  isMgr: boolean;
  currentUserId: string | undefined;
  prospects: SpRow[];
  members: Member[];
  selectedBulk: Set<string>;
  setSelectedBulk: (s: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  onPatchProspect: (prospectId: string, body: Record<string, unknown>) => void;
  onOpenFiche: (p: SpRow) => void;
}) {
  const {
    isMgr,
    currentUserId,
    prospects,
    members,
    selectedBulk,
    setSelectedBulk,
    onPatchProspect,
    onOpenFiche,
  } = props;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {isMgr ? (
              <TableHead className="w-11">
                <Checkbox
                  checked={
                    prospects.length > 0 && selectedBulk.size === prospects.length
                      ? true
                      : selectedBulk.size > 0
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(c) => {
                    if (c === true) {
                      setSelectedBulk(new Set(prospects.map((p) => p.prospectId)));
                    } else {
                      setSelectedBulk(new Set());
                    }
                  }}
                />
              </TableHead>
            ) : null}
            <TableHead>Prospect</TableHead>
            <TableHead>Statut</TableHead>
            {isMgr ? <TableHead>Assigné</TableHead> : null}
            <TableHead className="w-[88px]">Fiche</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prospects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isMgr ? 5 : 3} className="text-center text-muted-foreground">
                {isMgr
                  ? "Aucun prospect dans ce sprint."
                  : "Aucun prospect ne vous est assigné dans ce sprint."}
              </TableCell>
            </TableRow>
          ) : (
            prospects.map((p) => (
              <TableRow
                key={p.prospectId}
                className={cn(
                  "border-l-4",
                  CRM_STATUT_ROW_ACCENT[p.statut] ?? "border-l-transparent",
                )}
              >
                {isMgr ? (
                  <TableCell className="w-11">
                    <Checkbox
                      checked={selectedBulk.has(p.prospectId)}
                      onCheckedChange={() => {
                        setSelectedBulk((prev) => {
                          const n = new Set(prev);
                          if (n.has(p.prospectId)) n.delete(p.prospectId);
                          else n.add(p.prospectId);
                          return n;
                        });
                      }}
                    />
                  </TableCell>
                ) : null}
                <TableCell>
                  <div className="font-medium">
                    {p.prenom ? `${p.prenom} ` : ""}
                    {p.nom}
                  </div>
                  <div className="text-muted-foreground text-xs">{p.email ?? "—"}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "w-fit font-normal",
                        CRM_STATUT_BADGE_CLASS[p.statut] ?? "border-border",
                      )}
                    >
                      {CRM_PROSPECT_STATUT_LABELS[p.statut as CrmProspectStatut] ?? p.statut}
                    </Badge>
                    <Select
                      value={p.statut}
                      onValueChange={(v) => void onPatchProspect(p.prospectId, { statut: v })}
                      disabled={!isMgr && p.assignedUserId !== currentUserId}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CRM_PROSPECT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {CRM_PROSPECT_STATUT_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
                {isMgr ? (
                  <TableCell>
                    <Select
                      value={p.assignedUserId ?? "__none"}
                      onValueChange={(v) =>
                        void onPatchProspect(p.prospectId, {
                          assignedUserId: v === "__none" ? null : v,
                        })
                      }
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Non assigné</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.userId} value={m.userId}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                ) : null}
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void onOpenFiche(p)}
                  >
                    Ouvrir
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
