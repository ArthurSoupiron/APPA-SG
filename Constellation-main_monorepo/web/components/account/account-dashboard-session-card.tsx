"use client";

import { ArrowDown01Icon, ArrowUp01Icon, ShieldKeyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";

function formatSessionDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMMM yyyy, HH:mm", { locale: fr });
  } catch {
    return String(value);
  }
}

function SessionInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Item variant="muted" size="sm">
      <ItemContent>
        <ItemTitle>
          <PretextBlock as="span" metric={PRETEXT.smMedium} text={label} />
        </ItemTitle>
        <ItemDescription>
          <PretextBlock as="span" metric={PRETEXT.sm} text={value} />
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

export type AccountDashboardSessionCardUser = {
  id: string;
  email: string;
};

export type AccountDashboardSessionCardSession = {
  id: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function AccountDashboardSessionCard({
  user,
  session,
}: {
  user: AccountDashboardSessionCardUser;
  session: AccountDashboardSessionCardSession;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <Card size="sm" className="max-w-2xl gap-2 py-3 sm:max-w-xl">
      <CardHeader className="flex-row items-center gap-2 border-b border-border/60 pb-2 pt-0">
        <HugeiconsIcon
          icon={ShieldKeyIcon}
          strokeWidth={2}
          className="size-4 shrink-0 text-muted-foreground"
        />
        <CardTitle className="text-base">Session courante</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 pt-3 pb-1">
        <ItemGroup>
          <SessionInfoRow label="Expire le" value={formatSessionDate(session.expiresAt)} />
          <SessionInfoRow label="Début de session" value={formatSessionDate(session.createdAt)} />
        </ItemGroup>

        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-between text-muted-foreground"
            >
              <span>Détails techniques</span>
              {detailsOpen ? (
                <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-4" />
              ) : (
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ItemGroup className="mt-2">
              <SessionInfoRow label="ID utilisateur" value={user.id} />
              <SessionInfoRow label="ID de session" value={session.id} />
              {session.ipAddress ? (
                <SessionInfoRow label="Adresse IP" value={session.ipAddress} />
              ) : null}
              {session.userAgent ? (
                <SessionInfoRow label="Navigateur" value={session.userAgent} />
              ) : null}
            </ItemGroup>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
