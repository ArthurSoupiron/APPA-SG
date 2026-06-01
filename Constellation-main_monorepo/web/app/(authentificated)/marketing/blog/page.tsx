"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AccountPageMain } from "@/components/account/account-page-main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { MarketingNav } from "../_components/marketing-nav";
import { marketingFetch, marketingPost } from "../_lib/marketing-api";

type BlogItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isDraft: boolean;
  updatedAt: string;
};

export default function MarketingBlogPage() {
  const [items, setItems] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await marketingFetch<{ items: BlogItem[] }>("/webflow/blog");
    setItems(res.items);
  }, []);

  useEffect(() => {
    void load().catch((e) => toast.error(e instanceof Error ? e.message : "Erreur"));
  }, [load]);

  const sync = async () => {
    setLoading(true);
    try {
      await marketingPost("/webflow/blog/sync");
      await load();
      toast.success("Blog synchronisé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec sync");
    } finally {
      setLoading(false);
    }
  };

  const publish = async (id: string) => {
    try {
      await marketingPost(`/webflow/blog/${id}/publish`);
      await load();
      toast.success("Article publié sur Webflow");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec publication");
    }
  };

  return (
    <AccountPageMain className="space-y-6">
      <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Blog Webflow" />
      <MarketingNav />
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Articles</CardTitle>
          <Button type="button" disabled={loading} onClick={() => void sync()}>
            Synchroniser Webflow
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground whitespace-normal">
              Aucun article. Configurez Webflow ou créez un brouillon via l&apos;API.
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 whitespace-normal break-words">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">/{item.slug}</p>
                <p className="text-xs text-muted-foreground">
                  {item.status} · {new Date(item.updatedAt).toLocaleString("fr-FR")}
                </p>
              </div>
              {item.isDraft && (
                <Button type="button" size="sm" onClick={() => void publish(item.id)}>
                  Publier
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </AccountPageMain>
  );
}
