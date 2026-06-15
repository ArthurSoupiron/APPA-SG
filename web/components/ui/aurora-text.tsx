"use client";

import { memo, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AuroraTextProps = {
  children: ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
};

/** Effet Aurora (Magic UI) — https://magicui.design/docs/components/aurora-text */
export const AuroraText = memo(function AuroraText({
  children,
  className,
  colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
  speed = 1,
}: AuroraTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${colors[0]})`,
    WebkitBackgroundClip: "text" as const,
    WebkitTextFillColor: "transparent" as const,
    backgroundClip: "text" as const,
    animationDuration: `${10 / speed}s`,
  };

  return (
    <span className={cn("relative inline-block", className)}>
      <span className="sr-only">{children}</span>
      <span
        className="animate-aurora relative bg-size-[200%_auto] bg-clip-text text-transparent"
        style={gradientStyle}
        aria-hidden
      >
        {children}
      </span>
    </span>
  );
});

AuroraText.displayName = "AuroraText";
