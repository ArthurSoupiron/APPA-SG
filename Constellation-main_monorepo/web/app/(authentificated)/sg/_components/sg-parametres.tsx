"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { gedCount, useSg } from "../_lib/sg-store";

export function SgParametres() {
  const { data, mutate, reset } = useSg();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Types de pièces */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pièces du dossier membre</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {data.docTypes.map((d) => (
              <div key={d.code} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{d.label}</div>
                  <div className="font-mono text-xs text-muted-foreground">{d.code}</div>
                </div>
                <Button
                  size="sm"
                  variant={d.required ? "default" : "outline"}
                  onClick={() =>
                    mutate((draft) => {
                      const t = draft.docTypes.find((x) => x.code === d.code);
                      if (t) t.required = !t.required;
                      return draft;
                    })
                  }
                >
                  {d.required ? "Obligatoire" : "Optionnel"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Catégories GED */}
        <Card>
          <CardHeader><CardTitle className="text-base">Catégories de la GED</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {data.gedCats.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="font-mono text-xs text-muted-foreground">{c.id} · {gedCount(data, c.id)} document(s)</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Accès & SSO</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              ["SSO Google Workspace", "Activé"],
              ["Contrôle d'accès (UBAC)", "Bureau · Pôles"],
              ["Stockage", "Cloud chiffré · UE"],
              ["Sauvegarde", "Quotidienne"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
                <span className="text-muted-foreground">{k}</span>
                <Badge>{v}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Données de démonstration</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vos modifications sont enregistrées localement dans ce navigateur. Réinitialiser efface ces changements
              et restaure le jeu de données d'origine.
            </p>
            <Button variant="outline" onClick={() => setConfirmReset(true)}>Réinitialiser la démo</Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser la démo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les modifications locales seront effacées et les données d'origine restaurées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { reset(); toast.success("Données réinitialisées"); }}>
              Tout réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
