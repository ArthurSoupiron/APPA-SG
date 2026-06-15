"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUbacSession } from "@/lib/ubac-client";
import { fetchSiRegistresInitial, scanDriveImport } from "../../_lib/si-registres-api";
import type { RegistreDto, SiRegistresInitialData, TraitementDataDto } from "../../_lib/si-registres-types";
import { SiGoogleIntegrationBanner } from "../si-google-integration-banner";
import { SiConformityExplorer } from "./si-conformity-explorer";

export function SiRegistresSection() {
  const { hasPermission } = useUbacSession();
  const canEdit = hasPermission("si.registres.write");
  const canDelete = hasPermission("si.registres.delete");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [data, setData] = useState<SiRegistresInitialData | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const next = await fetchSiRegistresInitial();
    setData(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleScan = async () => {
    setScanning(true);
    const report = await scanDriveImport();
    setScanning(false);
    if (!report) return;
    toast.success(
      `Import terminé : ${report.created} créé(s), ${report.skipped} ignoré(s), ${report.errors.length} erreur(s).`,
    );
    if (report.errors.length > 0) {
      console.warn("[si-registres] scan errors", report.errors);
    }
    await reload();
  };

  const onRegistresChange = (registres: RegistreDto[]) => {
    setData((prev) => (prev ? { ...prev, registres } : prev));
  };

  const onTraitementsChange = (traitements: TraitementDataDto[]) => {
    setData((prev) => (prev ? { ...prev, traitements } : prev));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Chargement des registres…
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground whitespace-normal break-words">
        Impossible de charger les registres. Vérifiez vos permissions ou réessayez.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <SiGoogleIntegrationBanner />
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && data.driveConfigured && (
          <Button type="button" variant="outline" disabled={scanning} onClick={() => void handleScan()}>
            {scanning ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Import en cours…
              </>
            ) : (
              "Importer depuis Drive"
            )}
          </Button>
        )}
        {!data.driveConfigured && (
          <p className="text-sm text-muted-foreground whitespace-normal break-words">
            DRIVE_REGISTRES_FOLDER_URL n'est pas configuré côté serveur.
          </p>
        )}
      </div>
      <SiConformityExplorer
        initialRegistres={data.registres}
        initialTraitements={data.traitements}
        canEdit={canEdit}
        canDelete={canDelete}
        onRegistresChange={onRegistresChange}
        onTraitementsChange={onTraitementsChange}
        onReload={reload}
        traitementDataTemplateUrl={
          data.traitementDataTemplateUrl ||
          "https://kiwix.junior-entreprises.com/document/document/37669"
        }
      />
    </div>
  );
}
