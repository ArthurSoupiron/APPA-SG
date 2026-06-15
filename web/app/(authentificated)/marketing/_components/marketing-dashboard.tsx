"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { marketingFetch } from "../_lib/marketing-api";

type Dashboard = {
  subscribers: number;
  activeSubscribers: number;
  campaigns: number;
};

type StatusPayload = {
  configured: boolean;
  latest: { fetchedAt: string } | null;
};

export function MarketingDashboard() {
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [li, setLi] = useState<StatusPayload | null>(null);
  const [yt, setYt] = useState<StatusPayload | null>(null);
  const [wf, setWf] = useState<{ configured: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [d, linkedin, youtube, webflow] = await Promise.all([
          marketingFetch<Dashboard>("/newsletter/dashboard"),
          marketingFetch<StatusPayload>("/linkedin/status"),
          marketingFetch<StatusPayload>("/youtube/status"),
          marketingFetch<{ configured: boolean }>("/webflow/status"),
        ]);
        setDash(d);
        setLi(linkedin);
        setYt(youtube);
        setWf(webflow);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur chargement");
      }
    })();
  }, []);

  if (error) {
    return <p className="text-sm text-destructive whitespace-normal break-words">{error}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abonnés actifs</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{dash?.activeSubscribers ?? "—"}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campagnes</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{dash?.campaigns ?? "—"}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">LinkedIn</CardTitle>
        </CardHeader>
        <CardContent className="text-sm whitespace-normal break-words text-muted-foreground">
          {li?.configured
            ? li.latest
              ? `Cache : ${new Date(li.latest.fetchedAt).toLocaleString("fr-FR")}`
              : "Configuré — pas encore synchronisé"
            : "Non configuré"}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">YouTube</CardTitle>
        </CardHeader>
        <CardContent className="text-sm whitespace-normal break-words text-muted-foreground">
          {yt?.configured
            ? yt.latest
              ? `Cache : ${new Date(yt.latest.fetchedAt).toLocaleString("fr-FR")}`
              : "Configuré — pas encore synchronisé"
            : "Non configuré"}
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Webflow blog</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {wf?.configured ? "API Webflow connectée" : "WEBFLOW_SITE_ID / WEBFLOW_API_TOKEN manquants"}
        </CardContent>
      </Card>
    </div>
  );
}
