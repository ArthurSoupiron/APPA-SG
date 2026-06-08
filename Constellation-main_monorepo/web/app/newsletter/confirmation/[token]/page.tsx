"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewsletterConfirmPage() {
  const params = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    void fetch(`/api/public/newsletter/confirm/${params.token}`)
      .then((r) => setStatus(r.ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, [params.token]);

  return (
    <main className="mx-auto max-w-lg p-6">
      <Card>
        <CardHeader>
          <CardTitle>Confirmation newsletter</CardTitle>
        </CardHeader>
        <CardContent className="text-sm whitespace-normal break-words">
          {status === "loading" && <p>Validation en cours…</p>}
          {status === "ok" && <p>Votre inscription est confirmée. Merci.</p>}
          {status === "error" && (
            <p className="text-destructive">Lien invalide ou expiré. Contactez-nous si besoin.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
