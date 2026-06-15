import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";

type SprintHead = {
  name: string;
  theme: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  isPublic: boolean;
};

export function CrmSprintDetailHeader(props: {
  onBack: () => void;
  sprint: SprintHead;
  dateLine: string | null;
  isMgr: boolean;
  onOpenEdit: () => void;
  onDelete: () => void;
  /** `managerOnly` : uniquement les boutons gestionnaire (titre déjà affiché ailleurs). */
  variant?: "full" | "managerOnly";
}) {
  const { onBack, sprint, dateLine, isMgr, onOpenEdit, onDelete, variant = "full" } = props;

  const managerActions = isMgr ? (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onOpenEdit}>
        Modifier le sprint
      </Button>
      <Button type="button" variant="destructive" size="sm" onClick={() => void onDelete()}>
        Supprimer le sprint
      </Button>
    </div>
  ) : null;

  if (variant === "managerOnly") {
    return managerActions ? (
      <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-end">
        {managerActions}
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <Button type="button" variant="ghost" size="sm" className="mb-1 px-0" onClick={onBack}>
          ← Liste des sprints
        </Button>
        <PretextBlock as="h1" metric={PRETEXT.smMedium} text={sprint.name} />
        {sprint.theme ? (
          <PretextBlock
            as="p"
            metric={PRETEXT.sm}
            text={sprint.theme}
            className="text-muted-foreground"
          />
        ) : null}
        {dateLine ? (
          <PretextBlock
            as="p"
            metric={PRETEXT.xs}
            text={dateLine}
            className="mt-1 font-medium text-brand"
          />
        ) : null}
        <PretextBlock
          as="p"
          metric={PRETEXT.xs}
          text={sprint.isPublic ? "Sprint public" : "Sprint privé"}
          className="mt-1 text-muted-foreground uppercase tracking-wide"
        />
      </div>
      {managerActions}
    </div>
  );
}
