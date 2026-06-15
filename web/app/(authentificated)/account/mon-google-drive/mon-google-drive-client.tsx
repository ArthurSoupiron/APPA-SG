"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AccountPageMain } from "@/components/account/account-page-main";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { DriveTreeCanvas } from "./drive-tree-canvas";
import { fetchJson, type SharedDrive } from "./mon-google-drive-api";

export default function MonGoogleDriveClient(
  props: { embedded?: boolean; hideTitle?: boolean } = {},
) {
  const [drives, setDrives] = useState<SharedDrive[]>([]);
  const [nextDrivePage, setNextDrivePage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMoreDrives, setLoadingMoreDrives] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDrives = useCallback(async (pageToken: string | null, append: boolean) => {
    const url = pageToken
      ? `/api/app/drive/shared-drives?pageToken=${encodeURIComponent(pageToken)}`
      : "/api/app/drive/shared-drives";
    const r = await fetchJson<{ drives: SharedDrive[]; nextPageToken: string | null }>(url);
    if (!r.ok) {
      const b = r.body as { message?: string };
      const msg =
        typeof b?.message === "string"
          ? b.message
          : r.status === 403
            ? "Connexion Google requise, ou scopes Drive non accordés (reconnectez-vous avec Google)."
            : "Impossible de charger les Drives partagés.";
      throw new Error(msg);
    }
    setDrives((prev) => (append ? [...prev, ...r.data.drives] : r.data.drives));
    setNextDrivePage(r.data.nextPageToken ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadDrives(null, false);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadDrives]);

  const onLoadMoreDrives = useCallback(() => {
    if (!nextDrivePage) return;
    void (async () => {
      setLoadingMoreDrives(true);
      try {
        await loadDrives(nextDrivePage, true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoadingMoreDrives(false);
      }
    })();
  }, [loadDrives, nextDrivePage]);

  const content = (
    <>
      {props.hideTitle ? null : (
        <header className="shrink-0">
          <PretextBlock
            as={props.embedded ? "h2" : "h1"}
            metric={props.embedded ? PRETEXT.smMedium : PRETEXT.h1Page}
            text="Mon Google Drive"
          />
        </header>
      )}

      {loading ? (
        <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
          <Spinner className="size-6" />
          <span>Chargement des drives…</span>
        </div>
      ) : null}

      {error ? (
        <div className="max-w-2xl shrink-0 space-y-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm whitespace-normal [overflow-wrap:anywhere]">
          <div role="paragraph" className="text-destructive">
            {error}
          </div>
          <div role="paragraph" className="text-muted-foreground">
            Si besoin, déconnectez-vous puis reconnectez-vous avec Google depuis{" "}
            <Link href="/" className="underline">
              l’accueil
            </Link>
            .
          </div>
        </div>
      ) : null}

      {!loading && !error && drives.length === 0 ? (
        <div role="paragraph" className="shrink-0 text-muted-foreground text-sm">
          Aucun Drive partagé trouvé pour ce compte Google.
        </div>
      ) : null}

      {!loading && !error && drives.length > 0 ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <DriveTreeCanvas drives={drives} className="min-h-0 flex-1" />
          {nextDrivePage ? (
            <Button
              variant="outline"
              size="sm"
              className="w-fit shrink-0"
              disabled={loadingMoreDrives}
              onClick={onLoadMoreDrives}
            >
              {loadingMoreDrives ? (
                <>
                  <Spinner className="size-4" /> Chargement…
                </>
              ) : (
                "Charger d’autres drives"
              )}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );

  if (props.embedded) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {props.hideTitle ? (
          <PretextBlock
            as="p"
            metric={PRETEXT.sm}
            text="Parcourez les drives partagés accessibles avec votre compte Google."
            className="shrink-0 text-muted-foreground whitespace-normal break-words"
          />
        ) : null}
        {content}
      </div>
    );
  }

  return (
    <AccountPageMain className="flex min-h-0 flex-1 flex-col gap-3 py-4 sm:gap-4 sm:py-5">
      {content}
    </AccountPageMain>
  );
}
