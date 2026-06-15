"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TagRow = { id: string; slug: string; label: string; unsubscribedAt: string | null };

export default function NewsletterUnsubscribePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [email, setEmail] = useState("");
  const [tags, setTags] = useState<TagRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);

  useEffect(() => {
    void fetch(`/api/public/newsletter/unsubscribe/${token}`)
      .then((r) => r.json())
      .then((data: { email?: string; tags?: TagRow[] }) => {
        setEmail(data.email ?? "");
        setTags(data.tags ?? []);
      });
  }, [token]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async (global: boolean) => {
    await fetch(`/api/public/newsletter/unsubscribe/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ global, tagIds: [...selected] }),
    });
    setDone(true);
  };

  return (
    <main className="mx-auto max-w-lg p-6">
      <Card>
        <CardHeader>
          <CardTitle>Désabonnement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm whitespace-normal break-words">
          {done ? (
            <p>Vos préférences ont été enregistrées.</p>
          ) : (
            <>
              <p className="text-muted-foreground">{email}</p>
              {tags.length > 0 && (
                <ul className="space-y-2">
                  {tags.map((t) => (
                    <li key={t.id}>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggle(t.id)}
                        />
                        {t.label}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" onClick={() => void submit(false)}>
                  Mettre à jour les préférences
                </Button>
                <Button type="button" variant="destructive" onClick={() => void submit(true)}>
                  Désabonnement global
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
