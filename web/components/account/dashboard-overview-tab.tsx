"use client";

import { Home09Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

import {
  AccountDashboardSessionCard,
  type AccountDashboardSessionCardSession,
  type AccountDashboardSessionCardUser,
} from "@/components/account/account-dashboard-session-card";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMMM yyyy, HH:mm", { locale: fr });
  } catch {
    return String(value);
  }
}

function initials(name: string | null | undefined, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0]?.toUpperCase() ?? "?";
}

type ProfileField = { label: string; value: string };

function ProfileFields({ fields }: { fields: ProfileField[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {fields.map(({ label, value }) => (
        <div key={label} className="flex min-w-0 flex-col gap-1">
          <dt>
            <PretextBlock
              as="span"
              metric={PRETEXT.xs}
              text={label}
              className="text-muted-foreground"
            />
          </dt>
          <dd>
            <PretextBlock
              as="span"
              metric={PRETEXT.sm}
              text={value}
              className="whitespace-normal break-words"
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DashboardOverviewTab() {
  const { data } = authClient.useSession();
  if (!data?.user) return null;

  const { user, session } = data;

  async function handleSignOut() {
    await authClient.signOut();
    window.location.assign("/");
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bonne après-midi" : "Bonsoir";
  const firstName = user.name?.split(" ")[0] ?? user.email;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-1">
        <PretextBlock
          as="h2"
          metric={PRETEXT.smMedium}
          text={`${greeting}, ${firstName} !`}
        />
        <PretextBlock
          as="p"
          metric={PRETEXT.sm}
          text="Votre profil, votre session active et les raccourcis de navigation."
          className="text-muted-foreground"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Card className="h-full">
          <CardHeader className="flex-row items-start gap-4 pb-4">
            <div className="relative shrink-0">
              <Avatar size="lg" className="size-14">
                {user.image && <AvatarImage src={user.image} alt={user.name ?? user.email} />}
                <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
              </Avatar>
              <AvatarBadge
                className={
                  user.emailVerified
                    ? "size-3.5 bg-green-500 ring-background"
                    : "size-3.5 bg-muted-foreground ring-background"
                }
                aria-label={user.emailVerified ? "Compte vérifié" : "Compte non vérifié"}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base leading-snug">
                  {user.name ?? user.email}
                </CardTitle>
                <Badge variant={user.emailVerified ? "default" : "outline"}>
                  {user.emailVerified ? "Vérifié" : "Non vérifié"}
                </Badge>
              </div>
              <CardDescription className="whitespace-normal break-words text-sm leading-relaxed">
                {user.email}
              </CardDescription>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            <ProfileFields
              fields={[
                { label: "Nom complet", value: user.name ?? "—" },
                { label: "Adresse e-mail", value: user.email },
                { label: "Membre depuis", value: formatDate(user.createdAt) },
              ]}
            />
          </CardContent>
        </Card>

        <AccountDashboardSessionCard
          user={user as AccountDashboardSessionCardUser}
          session={session as AccountDashboardSessionCardSession}
        />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border/60 pt-5">
        <Button variant="destructive" onClick={() => void handleSignOut()} className="gap-2">
          <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" />
          Se déconnecter
        </Button>
        <Button variant="outline" asChild>
          <Link href="/" className="gap-2">
            <HugeiconsIcon icon={Home09Icon} strokeWidth={2} className="size-4" />
            Retour à l&apos;accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
