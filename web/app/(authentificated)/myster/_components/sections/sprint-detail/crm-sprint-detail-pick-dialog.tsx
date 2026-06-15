import { CRM_SECTEURS_OPTIONS_WITH_FILTER_ALL } from "@myster/_lib/crm-secteurs";
import { CRM_PROSPECT_STATUT_LABELS, type CrmProspectStatut } from "@myster/_lib/crm-statuts";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Member, ProspectOpt } from "./crm-sprint-detail-types";

export function CrmSprintDetailPickDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickSecteur: string;
  setPickSecteur: (v: string) => void;
  onSecteurChange: (v: string) => void;
  pickDefaultAssignee: string;
  setPickDefaultAssignee: (v: string) => void;
  members: Member[];
  allProspects: ProspectOpt[];
  pickIds: Set<string>;
  setPickIds: (s: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  onAddPicked: () => void;
}) {
  const {
    open,
    onOpenChange,
    pickSecteur,
    setPickSecteur,
    onSecteurChange,
    pickDefaultAssignee,
    setPickDefaultAssignee,
    members,
    allProspects,
    pickIds,
    setPickIds,
    onAddPicked,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <PretextBlock as="span" metric={PRETEXT.smMedium} text="Choisir des prospects" />
          </DialogTitle>
        </DialogHeader>
        <div
          role="paragraph"
          className="text-muted-foreground text-sm whitespace-normal break-words [overflow-wrap:anywhere]"
        >
          Liste limitée aux statuts « À contacter » et « À recontacter », déjà hors de ce sprint.
          Filtrez par la même liste que sur la fiche prospect (NAF rév. 2).
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pick-secteur">Secteur (NAF rév. 2)</Label>
          <Select
            value={pickSecteur}
            onValueChange={(v) => {
              setPickSecteur(v);
              setPickIds(new Set());
              onSecteurChange(v);
            }}
          >
            <SelectTrigger id="pick-secteur" className="w-full">
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(70vh,28rem)]">
              {CRM_SECTEURS_OPTIONS_WITH_FILTER_ALL.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 rounded-lg border border-brand/20 bg-brand/5 p-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">
            Assignation par défaut (nouveaux dans le sprint)
          </Label>
          <Select
            value={pickDefaultAssignee || "__"}
            onValueChange={(v) => setPickDefaultAssignee(v === "__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Non assigné" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Non assigné</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.userId} value={m.userId}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {allProspects.length === 0 ? (
            <div
              role="paragraph"
              className="text-muted-foreground rounded-md border border-dashed p-4 text-sm"
            >
              Aucun prospect ne correspond à ces critères (ou tous sont déjà dans ce sprint).
            </div>
          ) : (
            allProspects.map((pr) => {
              const pickCbId = `pick-cb-${pr.id}`;
              return (
                <div key={pr.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                  <Checkbox
                    id={pickCbId}
                    checked={pickIds.has(pr.id)}
                    onCheckedChange={() => {
                      setPickIds((prev) => {
                        const n = new Set(prev);
                        if (n.has(pr.id)) n.delete(pr.id);
                        else n.add(pr.id);
                        return n;
                      });
                    }}
                    className="mt-0.5"
                  />
                  <Label htmlFor={pickCbId} className="min-w-0 flex-1 cursor-pointer font-normal">
                    <span className="block font-medium">
                      {pr.prenom ? `${pr.prenom} ` : ""}
                      {pr.nom}
                    </span>
                    <span className="text-muted-foreground block text-xs whitespace-normal break-words [overflow-wrap:anywhere]">
                      {pr.email ?? "—"}
                      {pr.secteur ? ` · ${pr.secteur}` : ""}
                      {pr.statut
                        ? ` · ${CRM_PROSPECT_STATUT_LABELS[pr.statut as CrmProspectStatut] ?? pr.statut}`
                        : ""}
                    </span>
                  </Label>
                </div>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void onAddPicked()}>
            Ajouter ({pickIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
