"use client";

import { AlertCircleIcon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type StatusBannerJob = {
  id: string;
  kind: string;
  status: string;
  progress: number | null;
  label: string | null;
  detail: Record<string, unknown> | null;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  visibleToAll: boolean;
};

export type StatusBannerAnnouncement = {
  id: string;
  title: string;
  body: string;
  severity: string;
  startsAt: string;
  endsAt: string | null;
};

function severityClass(sev: string): string {
  if (sev === "critical") return "border-destructive/60 bg-destructive/5";
  if (sev === "warning") return "border-amber-500/50 bg-amber-500/5";
  return "border-primary/20 bg-muted/40";
}

type BannerJson = {
  banners?: StatusBannerAnnouncement[];
  jobs?: StatusBannerJob[];
};

let statusBannerInFlight: Promise<BannerJson | null> | null = null;

async function fetchBannerJsonOnce(): Promise<BannerJson | null> {
  if (statusBannerInFlight) return statusBannerInFlight;
  statusBannerInFlight = (async () => {
    try {
      const res = await fetch("/api/app/status/banner", {
        credentials: "include",
      });
      if (res.status === 401) return { banners: [], jobs: [] };
      if (!res.ok) return null;
      return (await res.json()) as BannerJson;
    } catch {
      return null;
    } finally {
      statusBannerInFlight = null;
    }
  })();
  return statusBannerInFlight;
}

export function GlobalActivityBanner() {
  const [banners, setBanners] = useState<StatusBannerAnnouncement[]>([]);
  const [jobs, setJobs] = useState<StatusBannerJob[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const json = await fetchBannerJsonOnce();
      if (!json) return;
      setBanners(json.banners ?? []);
      setJobs(json.jobs ?? []);
    } catch {
      /* réseau : on garde le dernier état */
    }
  }, []);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void fetchStatus();
    }, 0);
    const id = window.setInterval(() => void fetchStatus(), 5000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, [fetchStatus]);

  if (banners.length === 0 && jobs.length === 0) return null;

  return (
    <div
      className="max-h-[min(40vh,20rem)] shrink-0 space-y-2 overflow-x-hidden overflow-y-auto overscroll-y-contain border-b border-border/60 bg-background/95 px-3 py-2 md:px-4"
      aria-live="polite"
    >
      {banners.map((b) => (
        <Alert
          key={b.id}
          className={cn("rounded-xl", severityClass(b.severity))}
        >
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>{b.title}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {b.body}
          </AlertDescription>
        </Alert>
      ))}
      {jobs.map((j) => (
        <Alert key={j.id} className="rounded-xl border-primary/25 bg-muted/30">
          <HugeiconsIcon
            icon={Loading03Icon}
            strokeWidth={2}
            className="size-4 animate-spin"
          />
          <AlertTitle>
            {j.label ?? j.kind}
            <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
              {j.status}
            </span>
          </AlertTitle>
          <AlertDescription className="space-y-2">
            {typeof j.progress === "number" ? (
              <Progress value={j.progress} className="h-1.5" />
            ) : null}
            {j.error ? (
              <span className="text-destructive text-xs">{j.error}</span>
            ) : null}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
