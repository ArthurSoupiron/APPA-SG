import { CrmDayPickerField } from "@myster/_components/crm-day-picker-field";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function CrmSprintDetailEditDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editName: string;
  setEditName: (v: string) => void;
  editTheme: string;
  setEditTheme: (v: string) => void;
  editStart: string;
  setEditStart: (v: string) => void;
  editEnd: string;
  setEditEnd: (v: string) => void;
  editPublic: boolean;
  setEditPublic: (v: boolean) => void;
  editBusy: boolean;
  onSave: () => void;
}) {
  const {
    open,
    onOpenChange,
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
    onSave,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <PretextBlock as="span" metric={PRETEXT.smMedium} text="Modifier le sprint" />
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label htmlFor="sprint-name">Nom</Label>
            <Input
              id="sprint-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sprint-theme">Thème / objectif</Label>
            <Input
              id="sprint-theme"
              value={editTheme}
              onChange={(e) => setEditTheme(e.target.value)}
              placeholder="Optionnel"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CrmDayPickerField
              id="sprint-start"
              label="Début (jour)"
              value={editStart}
              onChange={setEditStart}
            />
            <CrmDayPickerField
              id="sprint-end"
              label="Fin (jour)"
              value={editEnd}
              onChange={setEditEnd}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-2">
            <Label htmlFor="sprint-public" className="cursor-pointer">
              Sprint public
            </Label>
            <Switch id="sprint-public" checked={editPublic} onCheckedChange={setEditPublic} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={editBusy} onClick={() => void onSave()}>
            {editBusy ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
