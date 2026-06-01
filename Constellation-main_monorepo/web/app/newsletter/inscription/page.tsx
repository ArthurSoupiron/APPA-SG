"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewsletterSubscribePage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          source: "web_form",
          tagSlugs: ["b2b"],
          consentText:
            "J'accepte de recevoir la newsletter JaegerMyster et j'ai lu la politique de confidentialité.",
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Inscription impossible");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Newsletter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <p className="text-sm whitespace-normal break-words">
              Merci. Un e-mail de confirmation vous a été envoyé (double opt-in). Consultez votre boîte
              de réception.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom (optionnel)</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive whitespace-normal break-words">{error}</p>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Envoi…" : "S'inscrire"}
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground whitespace-normal break-words">
            <Link href="/confidentialite" className="underline">
              Politique de confidentialité
            </Link>
            {" · "}
            <Link href="/mentions-legales" className="underline">
              Mentions légales
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
