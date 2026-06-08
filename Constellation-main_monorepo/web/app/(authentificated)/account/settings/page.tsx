"use client";

import { PRETEXT, PretextBlock } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountPageMain } from "@/components/account/account-page-main";
import { authClient } from "@/lib/auth-client";

export default function SettingsPage() {
  const { data } = authClient.useSession();
  const user = data?.user;

  return (
    <AccountPageMain className="space-y-6">
      <div>
        <PretextBlock as="h1" metric={PRETEXT.h1Page} text="Réglages" />
        <div className="mt-1 text-sm text-muted-foreground">
          Gérez votre profil, votre sécurité et vos préférences.
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Modifiez votre nom et votre adresse e-mail.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="mt-6 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" defaultValue={user?.name ?? ""} placeholder="Votre nom" readOnly />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email ?? ""}
                    placeholder="votre@email.com"
                    readOnly
                    className="flex-1"
                  />
                  <Badge variant={user?.emailVerified ? "default" : "outline"}>
                    {user?.emailVerified ? "Vérifiée" : "Non vérifiée"}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" disabled className="mt-2">
                Enregistrer les modifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Mot de passe</CardTitle>
              <CardDescription>
                Changez votre mot de passe pour sécuriser votre compte.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="mt-6 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input id="current-password" type="password" placeholder="••••••••" disabled />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input id="new-password" type="password" placeholder="••••••••" disabled />
              </div>
              <Button variant="outline" disabled>
                Changer le mot de passe
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Double authentification</CardTitle>
              <CardDescription>
                Ajoutez une couche de sécurité supplémentaire avec un authenticator TOTP.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="mt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Activer la 2FA</div>
                  <div className="text-xs text-muted-foreground">
                    Utilise une application authenticator (Google Authenticator, Authy…).
                  </div>
                </div>
                <Switch disabled aria-label="Activer la 2FA" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
              <CardDescription>
                Choisissez quand et comment vous souhaitez être notifié.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="mt-6 space-y-4">
              {[
                {
                  id: "notif-account",
                  label: "Activité du compte",
                  description: "Connexions, changements de mot de passe, sessions.",
                },
                {
                  id: "notif-crm",
                  label: "CRM & Pipeline",
                  description: "Nouvelles opportunités, rappels d'activité.",
                },
                {
                  id: "notif-jaeger",
                  label: "Jaeger",
                  description: "Missions, jalons et rappels.",
                },
              ].map(({ id, label, description }) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                  <Switch id={id} disabled aria-label={label} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AccountPageMain>
  );
}
