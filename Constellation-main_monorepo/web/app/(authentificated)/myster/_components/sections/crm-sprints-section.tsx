"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useUbacSession } from "@/lib/ubac-client";
import { cn } from "@/lib/utils";

type SprintRow = {
  id: string;
  name: string;
  theme: string | null;
  dateStart: string;
  dateEnd: string;
  isPublic: boolean;
  createdBy: string;
  memberCount?: number;
  isMember?: boolean;
  isCreator?: boolean;
};

function CrmSprintListRowCard(props: {
  s: SprintRow;
  isSelected: boolean;
  onOpenSprint: (id: string) => void;
  showJoinButton: boolean;
  onJoinPublic: (id: string) => void;
}) {
  const { s, isSelected, onOpenSprint, showJoinButton, onJoinPublic } = props;
  return (
    <Card
      className={cn(
        "transition-colors",
        isSelected && "border-brand/50 bg-brand/5 ring-2 ring-brand/30",
      )}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="w-full text-left font-semibold whitespace-normal wrap-anywhere hover:underline"
            onClick={() => onOpenSprint(s.id)}
            aria-current={isSelected ? "true" : undefined}
          >
            {s.name}
          </button>
          {s.theme ? (
            <PretextBlock
              as="p"
              metric={PRETEXT.sm}
              text={s.theme}
              className="text-muted-foreground"
            />
          ) : null}
          <PretextBlock
            as="p"
            metric={PRETEXT.xs}
            text={`${new Date(s.dateStart).toLocaleDateString("fr-FR")} → ${new Date(s.dateEnd).toLocaleDateString("fr-FR")}`}
            className="mt-1 text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {s.isPublic ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Public</span>
          ) : (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Privé</span>
          )}
          <span className="text-muted-foreground text-xs">{s.memberCount ?? 0} membre(s)</span>
          {showJoinButton ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => onJoinPublic(s.id)}>
              Rejoindre
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenSprint(s.id)}>
            Ouvrir
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}

export function CrmSprintsSection({
  selectedSprintId,
  onOpenSprint,
  onOpenNewSprint,
}: {
  /** Sprint actuellement ouvert dans le panneau de droite (surbrillance dans la liste). */
  selectedSprintId?: string | null;
  onOpenSprint: (id: string) => void;
  onOpenNewSprint: () => void;
}) {
  const { hasPermission } = useUbacSession();
  const [loading, setLoading] = useState(true);
  const [sprints, setSprints] = useState<SprintRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/app/crm/sprints", { credentials: "include" });
      if (res.status === 403) {
        toast.error("Permission refusée (crm.read).");
        return;
      }
      if (!res.ok) {
        toast.error("Impossible de charger les sprints.");
        return;
      }
      const json: { sprints?: SprintRow[] } = await res.json();
      setSprints(json.sprints ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function joinPublic(id: string) {
    const res = await fetch(`/api/app/crm/sprints/${encodeURIComponent(id)}/join`, {
      method: "POST",
      credentials: "include",
    });
    if (res.status === 403) {
      toast.error("Permission refusée (crm.sprint.join).");
      return;
    }
    if (!res.ok) {
      toast.error("Inscription impossible.");
      return;
    }
    toast.success("Inscrit au sprint.");
    await load();
  }

  const publicSprints = sprints.filter((s) => s.isPublic);
  const privateSprints = sprints.filter((s) => !s.isPublic);

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="flex flex-col gap-2 border-b border-brand/25 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PretextBlock as="h2" metric={PRETEXT.smMedium} text="Sprints" />
          <PretextBlock
            as="p"
            metric={PRETEXT.xs}
            text="Campagnes de prospection — publics ou dont vous êtes membre."
            className="mt-1 text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          {hasPermission("crm.sprint.create") ? (
            <Button type="button" onClick={onOpenNewSprint}>
              Nouveau sprint
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => void load()}>
            Actualiser
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner className="size-8" />
        </div>
      ) : sprints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun sprint visible.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {publicSprints.length > 0 ? (
            <div className="space-y-2">
              <div>
                <PretextBlock as="h3" metric={PRETEXT.smMedium} text="Sprints publics" />
                <PretextBlock
                  as="p"
                  metric={PRETEXT.xs}
                  text="Visibles par tous ; rejoignez pour participer."
                  className="mt-1 text-muted-foreground whitespace-normal wrap-anywhere"
                />
              </div>
              <div className="grid gap-2">
                {publicSprints.map((s) => (
                  <CrmSprintListRowCard
                    key={s.id}
                    s={s}
                    isSelected={selectedSprintId === s.id}
                    onOpenSprint={onOpenSprint}
                    showJoinButton={Boolean(
                      s.isPublic && !s.isMember && hasPermission("crm.sprint.join"),
                    )}
                    onJoinPublic={(id) => void joinPublic(id)}
                  />
                ))}
              </div>
            </div>
          ) : null}
          {privateSprints.length > 0 ? (
            <div className="space-y-2">
              <div>
                <PretextBlock as="h3" metric={PRETEXT.smMedium} text="Sprints privés" />
                <PretextBlock
                  as="p"
                  metric={PRETEXT.xs}
                  text="Campagnes fermées : accès réservé aux membres."
                  className="mt-1 text-muted-foreground whitespace-normal wrap-anywhere"
                />
              </div>
              <div className="grid gap-2">
                {privateSprints.map((s) => (
                  <CrmSprintListRowCard
                    key={s.id}
                    s={s}
                    isSelected={selectedSprintId === s.id}
                    onOpenSprint={onOpenSprint}
                    showJoinButton={false}
                    onJoinPublic={(id) => void joinPublic(id)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
