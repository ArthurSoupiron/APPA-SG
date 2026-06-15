"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AccountPageMain } from "@/components/account/account-page-main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { MarketingNav } from "../_components/marketing-nav";
import { marketingFetch, marketingPost } from "../_lib/marketing-api";

type Status = {
  configured: boolean;
  channelId: string | null;
  latest: { fetchedAt: string; payload: unknown } | null;
};

export default function MarketingYouTubePage() {
  const [data, setData] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setData(await marketingFetch<Status>("/youtube/status"));
  }, []);

  useEffect(() => {
    void load().catch((e) =>
      toast.error(e instanceof Error ? e.message : "Erreur"),
    );
  }, [load]);

  const sync = async (force = false) => {
    setLoading(true);
    try {
      await marketingPost(`/youtube/sync${force ? "?force=1" : ""}`);
      await load();
      toast.success("Chaîne synchronisée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec sync");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountPageMain className="space-y-6">
      <PretextBlock as="h1" metric={PRETEXT.h1Page} text="YouTube" />
      <MarketingNav />
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Analytics chaîne</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => void sync(false)}
            >
              Actualiser
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={() => void sync(true)}
            >
              Forcer la sync
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm whitespace-normal break-words">
          {!data?.configured && (
            <p className="text-muted-foreground">
              Configurez YOUTUBE_CHANNEL_ID et connectez Google.
            </p>
          )}
          {data?.latest && (
            <p className="text-muted-foreground">
              Dernière sync :{" "}
              {new Date(data.latest.fetchedAt).toLocaleString("fr-FR")}
            </p>
          )}
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap break-words">
            {data?.latest?.payload
              ? JSON.stringify(data.latest.payload, null, 2)
              : "Aucune donnée en cache."}
          </pre>
        </CardContent>
      </Card>
    </AccountPageMain>
  );
}
