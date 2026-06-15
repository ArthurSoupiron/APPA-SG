"use client";

import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Card, CardContent } from "@/components/ui/card";

export default function CrmActivitiesClient() {
  return (
    <AccountPageMain>
      <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Activités" />
      <Card className="mt-6">
        <CardContent className="flex min-h-32 items-start justify-start p-6 text-muted-foreground text-sm">
          Activités CRM à venir
        </CardContent>
      </Card>
    </AccountPageMain>
  );
}
