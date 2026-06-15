import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Member, UserOpt } from "./crm-sprint-detail-types";

export function CrmSprintDetailMembersCard(props: {
  isMgr: boolean;
  members: Member[];
  userOptions: UserOpt[];
  addMemberId: string;
  setAddMemberId: (v: string) => void;
  onAddMembers: () => void;
  onRemoveMember: (uid: string) => void;
}) {
  const { isMgr, members, userOptions, addMemberId, setAddMemberId, onAddMembers, onRemoveMember } =
    props;
  return (
    <Card className="border-brand/15">
      <CardHeader className="py-3">
        <PretextBlock as="h2" metric={PRETEXT.smMedium} text="Membres" />
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.userId}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2 last:border-0"
            >
              <span>
                {m.name} <span className="text-muted-foreground text-sm">({m.email})</span>
              </span>
              {isMgr ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => void onRemoveMember(m.userId)}
                >
                  Retirer
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {isMgr && userOptions.length > 0 ? (
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <Label>Ajouter un membre</Label>
              <Select
                value={addMemberId || "__"}
                onValueChange={(v) => setAddMemberId(v === "__" ? "" : v)}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__">—</SelectItem>
                  {userOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={() => void onAddMembers()} disabled={!addMemberId}>
              Ajouter
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
