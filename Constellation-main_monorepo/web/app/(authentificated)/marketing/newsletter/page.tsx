"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AccountPageMain } from "@/components/account/account-page-main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { MarketingNav } from "../_components/marketing-nav";
import { marketingFetch } from "../_lib/marketing-api";

type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  sentAt: string | null;
};

type Subscriber = {
  id: string;
  email: string;
  status: string;
};

export default function MarketingNewsletterPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  const load = useCallback(async () => {
    const [c, s] = await Promise.all([
      marketingFetch<{ items: Campaign[] }>("/newsletter/campaigns"),
      marketingFetch<{ items: Subscriber[] }>("/newsletter/subscribers"),
    ]);
    setCampaigns(c.items);
    setSubscribers(s.items);
  }, []);

  useEffect(() => {
    void load().catch((e) => toast.error(e instanceof Error ? e.message : "Erreur"));
  }, [load]);

  return (
    <AccountPageMain className="space-y-6">
      <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Newsletter" />
      <MarketingNav />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" asChild>
          <a href="/api/app/marketing/newsletter/consent-export" download>
            Exporter consentements (CSV)
          </a>
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/newsletter/inscription">Page inscription publique</Link>
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campagnes ({campaigns.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {campaigns.length === 0 && (
              <p className="text-muted-foreground whitespace-normal">Aucune campagne.</p>
            )}
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-md border border-border p-3 whitespace-normal break-words">
                <p className="font-medium">{c.name}</p>
                <p className="text-muted-foreground">{c.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {c.status}
                  {c.sentAt ? ` · ${new Date(c.sentAt).toLocaleString("fr-FR")}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Abonnés ({subscribers.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm max-h-96 overflow-y-auto">
            {subscribers.map((s) => (
              <p key={s.id} className="whitespace-normal break-words">
                {s.email}{" "}
                <span className="text-muted-foreground">({s.status})</span>
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </AccountPageMain>
  );
}
