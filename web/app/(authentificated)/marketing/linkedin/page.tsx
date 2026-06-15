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
  organizationId: string | null;
  latest: { fetchedAt: string; payload: unknown } | null;
};

export default function MarketingLinkedInPage() {
  const [data, setData] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await marketingFetch<Status>("/linkedin/status");
    setData(res);
  }, []);

  useEffect(() => {
    void load().catch((e) =>
      toast.error(e instanceof Error ? e.message : "Erreur"),
    );
  }, [load]);

  const sync = async (force = false) => {
    setLoading(true);
    try {
      await marketingPost(`/linkedin/sync${force ? "?force=1" : ""}`);
      await load();
      toast.success(
        force ? "Synchronisation forcée terminée" : "Données à jour",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec sync");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountPageMain className="space-y-6">
      <PretextBlock as="h1" metric={PRETEXT.h1Page} text="LinkedIn" />
      <MarketingNav />
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Métriques page entreprise</CardTitle>
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
              Configurez LINKEDIN_ORGANIZATION_ID et LINKEDIN_ACCESS_TOKEN (voir
              docs/marketing-integrations.md).
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
