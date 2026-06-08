"use client";

import { Home09Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { AccountDashboardSessionCard } from "@/components/account/account-dashboard-session-card";
import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Item variant="muted" size="sm">
      <ItemContent>
        <ItemTitle>
          <PretextBlock as="span" metric={PRETEXT.smMedium} text={label} />
        </ItemTitle>
        <ItemDescription>
          <PretextBlock as="span" metric={PRETEXT.sm} text={value} />
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

export default function AccountDashboardClient() {
  const { data } = authClient.useSession();

  if (!data?.user) return null;

  const { user, session } = data;

  async function handleSignOut() {
    await authClient.signOut();
    window.location.assign("/");
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bonne après-midi" : "Bonsoir";

  return (
    <AccountPageMain className="space-y-6">
      <div>
        <PretextBlock
          as="h1"
          metric={PRETEXT.h1Page}
          text={`${greeting}, ${user.name?.split(" ")[0] ?? user.email} !`}
        />
        <PretextBlock
          as="p"
          metric={PRETEXT.sm}
          text="Votre espace personnel Constellation."
          className="mt-1 text-muted-foreground"
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-4 pb-4">
          <div className="relative">
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
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{user.name ?? user.email}</CardTitle>
              <Badge variant={user.emailVerified ? "default" : "outline"}>
                {user.emailVerified ? "Vérifié" : "Non vérifié"}
              </Badge>
            </div>
            <CardDescription className="break-words whitespace-normal">
              {user.email}
            </CardDescription>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex flex-col gap-3 pt-4">
          <ItemGroup>
            <InfoRow label="Nom complet" value={user.name ?? "—"} />
            <InfoRow label="Adresse e-mail" value={user.email} />
            <InfoRow label="Membre depuis" value={formatDate(user.createdAt)} />
          </ItemGroup>
        </CardContent>
      </Card>

      <AccountDashboardSessionCard user={user} session={session} />

      <div className="flex flex-wrap gap-3">
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
    </AccountPageMain>
  );
}
