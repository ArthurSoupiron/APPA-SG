"use client";

// Briques visuelles partagées du module SG
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Member, MemberStatus } from "../_lib/sg-types";
import { STATUS_LABEL } from "../_lib/sg-types";

// ---- Icônes (SVG inline, héritent de la couleur via currentColor) ----

const ICON_CLS = "h-5 w-5";
export const IconDoc = () => (
  <svg className={ICON_CLS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
);
export const IconPen = () => (
  <svg className={ICON_CLS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);
export const IconCheck = () => (
  <svg className={ICON_CLS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
);
export const IconArchive = () => (
  <svg className={ICON_CLS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="5" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></svg>
);
export const IconUsers = () => (
  <svg className={ICON_CLS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
export const IconClock = () => (
  <svg className={ICON_CLS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
);
export const IconShield = () => (
  <svg className={ICON_CLS} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);

type Accent = "primary" | "amber" | "violet" | "rose" | "blue" | "muted";
const ACCENTS: Record<Accent, string> = {
  primary: "bg-primary/10 text-primary",
  amber: "bg-amber-500/10 text-amber-500",
  violet: "bg-violet-500/10 text-violet-500",
  rose: "bg-rose-500/10 text-rose-500",
  blue: "bg-blue-500/10 text-blue-500",
  muted: "bg-muted text-muted-foreground",
};

/** Carte de statistique : chip d'icône colorée + grand chiffre + libellé. */
export function StatCard({
  label,
  value,
  accent = "primary",
  icon,
}: {
  label: string;
  value: number | string;
  accent?: Accent;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      {icon && (
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", ACCENTS[accent])}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-2xl font-semibold leading-none tabular-nums">{value}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}

const AV_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-lime-100 text-lime-700",
];

function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

export function SgAvatar({
  member,
  size = 36,
}: {
  member: Pick<Member, "id" | "initials">;
  size?: number;
}) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", colorFor(member.id))}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
    >
      {member.initials}
    </div>
  );
}

const STATUS_VARIANT: Record<
  MemberStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  pending: "secondary",
  alumni: "outline",
  inactive: "destructive",
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  const label = STATUS_LABEL[status];
  return <Badge variant={STATUS_VARIANT[status]}>{label.k}</Badge>;
}

export function CompletenessBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <Progress value={pct} className="h-2 w-24" />
      <span className="w-9 text-right text-xs font-semibold tabular-nums">{pct}%</span>
    </div>
  );
}

/** Anneau circulaire de complétude (SVG) */
export function Ring({ pct, size = 64, stroke = 7 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const color = pct === 100 ? "var(--primary)" : pct >= 60 ? "#e08a1e" : "#d6453e";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-bold">{pct}%</div>
    </div>
  );
}

/** Pastilles d'état des pièces (vert/orange/rouge) */
export function DocDots({ member, docTypes }: { member: Member; docTypes: { code: string; required: boolean; label: string }[] }) {
  return (
    <div className="flex gap-1">
      {docTypes
        .filter((d) => d.required)
        .map((d) => {
          const v = member.docs[d.code];
          return (
            <span
              key={d.code}
              title={`${d.label} · ${v === "ok" ? "présent" : v === "pending" ? "en attente" : "manquant"}`}
              className={cn(
                "size-2.5 rounded-sm",
                v === "ok" ? "bg-primary" : v === "pending" ? "bg-amber-400" : "border border-destructive bg-destructive/10",
              )}
            />
          );
        })}
    </div>
  );
}
