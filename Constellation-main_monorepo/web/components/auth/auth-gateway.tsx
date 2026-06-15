"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JaegerMysterBrand } from "@/components/jaeger-myster-brand";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

export type AuthTab = "signin" | "signup";

type AuthGatewayInnerProps = {
  tab: AuthTab;
  setTab: (next: AuthTab) => void;
  oauthErrorPath: string;
  /** Préfixe ids champs (évite doublons si plusieurs blocs sur la même page). */
  fieldIdPrefix?: string;
  /** Panneau latéral : espacements et typo réduits pour éviter le scroll. */
  compact?: boolean;
};

function AuthGatewayInner({
  tab,
  setTab,
  oauthErrorPath,
  fieldIdPrefix = "",
  compact = false,
}: AuthGatewayInnerProps) {
  const router = useRouter();

  return (
    <Card
      className={
        compact
          ? "flex h-full min-h-0 w-full max-w-md flex-col gap-0 border-0 bg-transparent py-0 shadow-none ring-0"
          : "ring-border/60 w-full max-w-md border bg-card/85 shadow-xl ring-1 supports-backdrop-filter:backdrop-blur-md"
      }
      size={compact ? "sm" : "default"}
    >
      {!compact ? (
        <CardHeader className="space-y-1 pb-4 text-center sm:text-left">
          <JaegerMysterBrand variant="landing" />
          <CardDescription>Connexion ou création de compte — tout au même endroit.</CardDescription>
        </CardHeader>
      ) : null}
      <CardContent
        className={compact ? "flex min-h-0 flex-1 flex-col overflow-y-auto px-0 pt-0" : "space-y-6"}
      >
        <Tabs onValueChange={(v) => setTab(v as AuthTab)} value={tab}>
          <TabsList
            className={compact ? "grid h-8 w-full grid-cols-2 p-0.5" : "grid w-full grid-cols-2"}
          >
            <TabsTrigger className={compact ? "text-xs" : undefined} value="signin">
              Connexion
            </TabsTrigger>
            <TabsTrigger className={compact ? "text-xs" : undefined} value="signup">
              Inscription
            </TabsTrigger>
          </TabsList>
          <TabsContent className={compact ? "mt-2 space-y-2" : "mt-4 space-y-4"} value="signin">
            <SignInForm
              compact={compact}
              fieldIdPrefix={fieldIdPrefix}
              onSuccess={() => {
                router.push("/account");
                router.refresh();
              }}
            />
          </TabsContent>
          <TabsContent className={compact ? "mt-2 space-y-2" : "mt-4 space-y-4"} value="signup">
            <SignUpForm
              compact={compact}
              fieldIdPrefix={fieldIdPrefix}
              onSuccess={() => {
                router.push("/account");
                router.refresh();
              }}
            />
          </TabsContent>
        </Tabs>

        {compact ? (
          <div className="mt-auto flex shrink-0 flex-col gap-3 pt-3">
            <div className="relative py-0.5">
              <Separator />
              <span className="bg-transparent text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-1.5 text-[10px]">
                ou
              </span>
            </div>
            <OAuthInlineButtons compact oauthErrorPath={oauthErrorPath} />
          </div>
        ) : (
          <>
            <div className="relative py-1">
              <Separator />
              <span className="bg-card text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
                ou
              </span>
            </div>
            <OAuthInlineButtons compact={false} oauthErrorPath={oauthErrorPath} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

type AuthGatewayLandingProps = {
  initialTab?: AuthTab;
  /** Dans le panneau latéral de la landing : pas de cadre externe doublé. */
  embedded?: boolean;
};

/** Bloc auth sur la landing : pas de changement d’URL imposé par ce composant. */
export function AuthGatewayLanding({
  initialTab = "signin",
  embedded = false,
}: AuthGatewayLandingProps) {
  const [tab, setTab] = useState<AuthTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const inner = (
    <AuthGatewayInner
      compact={embedded}
      fieldIdPrefix="home-"
      oauthErrorPath="/"
      setTab={setTab}
      tab={tab}
    />
  );

  if (embedded) {
    return <div className="relative flex h-full min-h-0 w-full flex-col">{inner}</div>;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-muted/20 p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,var(--color-primary)_0%,transparent_50%),radial-gradient(ellipse_70%_50%_at_100%_100%,color-mix(in_oklch,var(--color-chart-2)_30%,transparent)_0%,transparent_45%)] opacity-80 dark:opacity-60"
      />
      <div className="from-background/80 absolute inset-0 bg-linear-to-b to-transparent" />
      <div className="relative z-10 flex w-full justify-center">{inner}</div>
    </div>
  );
}

function OAuthInlineButtons({
  compact = false,
  oauthErrorPath,
}: {
  compact?: boolean;
  oauthErrorPath: string;
}) {
  const [message, setMessage] = useState<string | null>(null);

  async function signInWithGoogle() {
    setMessage(null);
    const origin = window.location.origin;
    const errPath = oauthErrorPath.startsWith("/") ? oauthErrorPath : `/${oauthErrorPath}`;
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${origin}/account`,
      errorCallbackURL: `${origin}${errPath}`,
    });
    if (error) {
      setMessage(
        error.message ??
          "Google indisponible (vérifiez GOOGLE_CLIENT_* et BETTER_AUTH_URL sur le backend).",
      );
    }
  }

  return (
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      <Button
        className="w-full"
        onClick={() => void signInWithGoogle()}
        size={compact ? "sm" : "default"}
        type="button"
        variant="outline"
      >
        Continuer avec Google
      </Button>
      {message ? (
        <PretextBlock
          className={compact ? "text-destructive text-xs" : "text-destructive text-sm"}
          metric={compact ? PRETEXT.xs : PRETEXT.sm}
          role="status"
          text={message}
        />
      ) : null}
    </div>
  );
}

function SignInForm({
  compact = false,
  onSuccess,
  fieldIdPrefix = "",
}: {
  compact?: boolean;
  onSuccess: () => void;
  fieldIdPrefix?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: signError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/account",
      });
      if (signError) {
        setError(signError.message ?? "Connexion impossible");
        return;
      }
      onSuccess();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={compact ? "space-y-2.5" : "space-y-4"} onSubmit={onSubmit}>
      <div className={compact ? "space-y-1" : "space-y-2"}>
        <Label
          className={compact ? "text-xs" : undefined}
          htmlFor={`${fieldIdPrefix}auth-signin-email`}
        >
          Email
        </Label>
        <Input
          autoComplete="email"
          className={compact ? "h-8 text-sm" : undefined}
          id={`${fieldIdPrefix}auth-signin-email`}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div className={compact ? "space-y-1" : "space-y-2"}>
        <Label
          className={compact ? "text-xs" : undefined}
          htmlFor={`${fieldIdPrefix}auth-signin-password`}
        >
          Mot de passe
        </Label>
        <Input
          autoComplete="current-password"
          className={compact ? "h-8 text-sm" : undefined}
          id={`${fieldIdPrefix}auth-signin-password`}
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          value={password}
        />
      </div>
      {error ? (
        <PretextBlock
          className={compact ? "text-destructive text-xs" : "text-destructive text-sm"}
          metric={compact ? PRETEXT.xs : PRETEXT.sm}
          role="alert"
          text={error}
        />
      ) : null}
      <Button className="w-full" disabled={pending} size={compact ? "sm" : "default"} type="submit">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}

function SignUpForm({
  compact = false,
  onSuccess,
  fieldIdPrefix = "",
}: {
  compact?: boolean;
  onSuccess: () => void;
  fieldIdPrefix?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: signError } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (signError) {
        setError(signError.message ?? "Inscription impossible");
        return;
      }
      onSuccess();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={compact ? "space-y-2.5" : "space-y-4"} onSubmit={onSubmit}>
      <div className={compact ? "space-y-1" : "space-y-2"}>
        <Label
          className={compact ? "text-xs" : undefined}
          htmlFor={`${fieldIdPrefix}auth-signup-name`}
        >
          Nom
        </Label>
        <Input
          autoComplete="name"
          className={compact ? "h-8 text-sm" : undefined}
          id={`${fieldIdPrefix}auth-signup-name`}
          onChange={(e) => setName(e.target.value)}
          required
          type="text"
          value={name}
        />
      </div>
      <div className={compact ? "space-y-1" : "space-y-2"}>
        <Label
          className={compact ? "text-xs" : undefined}
          htmlFor={`${fieldIdPrefix}auth-signup-email`}
        >
          Email
        </Label>
        <Input
          autoComplete="email"
          className={compact ? "h-8 text-sm" : undefined}
          id={`${fieldIdPrefix}auth-signup-email`}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div className={compact ? "space-y-1" : "space-y-2"}>
        <Label
          className={compact ? "text-xs" : undefined}
          htmlFor={`${fieldIdPrefix}auth-signup-password`}
        >
          Mot de passe
        </Label>
        <Input
          autoComplete="new-password"
          className={compact ? "h-8 text-sm" : undefined}
          id={`${fieldIdPrefix}auth-signup-password`}
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={compact ? "≥ 8 caractères" : undefined}
          required
          type="password"
          value={password}
        />
        {compact ? null : (
          <PretextBlock
            className="text-muted-foreground text-xs"
            metric={PRETEXT.xs}
            text="Au moins 8 caractères."
          />
        )}
      </div>
      {error ? (
        <PretextBlock
          className={compact ? "text-destructive text-xs" : "text-destructive text-sm"}
          metric={compact ? PRETEXT.xs : PRETEXT.sm}
          role="alert"
          text={error}
        />
      ) : null}
      <Button className="w-full" disabled={pending} size={compact ? "sm" : "default"} type="submit">
        {pending ? "Création…" : "Créer le compte"}
      </Button>
    </form>
  );
}
