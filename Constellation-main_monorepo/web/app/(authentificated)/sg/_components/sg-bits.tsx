"use client";

// Briques visuelles partagées du module SG
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Member, MemberStatus } from "../_lib/sg-types";
import { STATUS_LABEL } from "../_lib/sg-types";

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
