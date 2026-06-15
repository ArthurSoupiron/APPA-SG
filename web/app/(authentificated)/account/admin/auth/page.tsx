"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useUbacSession } from "@/lib/ubac-client";

type AuthPolicyState = {
  emailPasswordEnabled: boolean;
  googleOAuthEnabled: boolean;
};

export default function AuthAdminPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: sessionLoading } = useUbacSession();
  const [policy, setPolicy] = useState<AuthPolicyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!isSuperAdmin) router.replace("/dashboard");
  }, [sessionLoading, isSuperAdmin, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/app/admin/auth-policy", { credentials: "include" });
      if (!res.ok) {
        toast.error("Chargement impossible.");
        return;
      }
      const data = (await res.json()) as AuthPolicyState;
      setPolicy({
        emailPasswordEnabled: data.emailPasswordEnabled,
        googleOAuthEnabled: data.googleOAuthEnabled,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading || !isSuperAdmin) return;
    void load();
  }, [sessionLoading, isSuperAdmin, load]);

  async function onToggle(checked: boolean) {
    if (!policy || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/app/admin/auth-policy", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailPasswordEnabled: checked }),
      });
      if (!res.ok) {
        toast.error("Enregistrement impossible.");
        return;
      }
      const data = (await res.json()) as AuthPolicyState;
      setPolicy({
        emailPasswordEnabled: data.emailPasswordEnabled,
        googleOAuthEnabled: data.googleOAuthEnabled,
      });
      toast.success(checked ? "Connexion email/mot de passe activée." : "Connexion email/mot de passe désactivée.");
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading || !isSuperAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Authentification</h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Connexion email et mot de passe</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading || !policy ? (
            <div className="flex items-center gap-2">
              <Spinner className="size-5" />
              <PretextBlock metric={PRETEXT.sm} text="Chargement…" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <Label className="whitespace-normal wrap-break-word" htmlFor="email-password-enabled">
                  Autoriser la connexion et l&apos;inscription par email et mot de passe
                </Label>
                <Switch
                  checked={policy.emailPasswordEnabled}
                  disabled={saving}
                  id="email-password-enabled"
                  onCheckedChange={(checked) => void onToggle(checked)}
                />
              </div>
              {!policy.googleOAuthEnabled && !policy.emailPasswordEnabled ? (
                <PretextBlock
                  className="text-destructive whitespace-normal wrap-break-word"
                  metric={PRETEXT.sm}
                  role="alert"
                  text="Google OAuth n'est pas configuré sur le backend : aucune méthode de connexion n'est disponible pour les visiteurs."
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
