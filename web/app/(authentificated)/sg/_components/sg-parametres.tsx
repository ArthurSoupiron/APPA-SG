"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { fetchSgDriveStatus, type SgDriveStatus } from "../_lib/sg-api";
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
  const [drive, setDrive] = useState<SgDriveStatus | null>(null);
  const [testingDrive, setTestingDrive] = useState(false);

  const loadDrive = async () => {
    setTestingDrive(true);
    setDrive(await fetchSgDriveStatus());
    setTestingDrive(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: chargement au montage uniquement
  useEffect(() => {
    void loadDrive();
  }, []);

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
          <CardHeader><CardTitle className="text-base">Recharger les données</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Les données du module sont enregistrées dans la base (Postgres). Recharger annule les éventuelles
              modifications locales non sauvegardées et récupère l'état de la base.
            </p>
            <Button variant="outline" onClick={() => setConfirmReset(true)}>Recharger depuis la base</Button>
          </CardContent>
        </Card>
      </div>

      {/* Intégration Google Drive */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Google Drive</CardTitle>
          <Button size="sm" variant="outline" disabled={testingDrive} onClick={() => void loadDrive()}>
            {testingDrive ? "Test…" : "Tester l'accès"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!drive && <p className="text-muted-foreground">Vérification de la configuration…</p>}
          {drive && !drive.configured && (
            <p className="text-amber-600">
              Aucun dossier configuré. Renseignez <span className="font-mono">DRIVE_SG_FOLDER_ID</span> (ou
              <span className="font-mono"> DRIVE_SG_PARENT_FOLDER_URL</span>) dans <span className="font-mono">backend/.env</span>.
            </p>
          )}
          {drive?.configured && (
            <>
              <div className="flex items-center justify-between border-b border-border py-2">
                <span className="text-muted-foreground">ID du dossier</span>
                <span className="font-mono text-xs">{drive.folderId}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-2">
                <span className="text-muted-foreground">Source</span>
                <Badge variant="outline">{drive.source === "id" ? "ID direct" : "URL"}</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-border py-2">
                <span className="text-muted-foreground">Accès</span>
                {drive.accessible ? (
                  <Badge>Connecté{drive.folderName ? ` · ${drive.folderName}` : ""}</Badge>
                ) : (
                  <Badge variant="secondary">Non accessible</Badge>
                )}
              </div>
              {!drive.accessible && drive.message && (
                <p className="text-amber-600">{drive.message}</p>
              )}
              {drive.accessible && drive.webViewLink && (
                <a href={drive.webViewLink} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Ouvrir le dossier dans Drive
                </a>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recharger depuis la base ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les modifications locales non sauvegardées seront annulées et l'état de la base sera rechargé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { reset(); toast.success("Données rechargées"); }}>
              Recharger
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
