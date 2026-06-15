import Image from "next/image";

import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/jeece.svg";

const VARIANT_STYLES = {
  landing: {
    rootGap: "gap-3 sm:gap-3.5",
    logoPx: 64,
    logoClass: "size-16",
    wordmark: "text-3xl leading-[1.05] sm:text-4xl",
    tagline:
      "mt-2 text-[0.625rem] font-medium uppercase leading-none tracking-[0.14em] text-foreground/85 sm:text-[0.6875rem]",
  },
  compact: {
    rootGap: "gap-2",
    logoPx: 32,
    logoClass: "size-8",
    wordmark: "text-base leading-none",
    tagline:
      "mt-1 text-[9px] font-medium uppercase leading-none tracking-[0.12em] text-foreground/80",
  },
} as const;

type JaegerMysterBrandProps = {
  className?: string;
  /** Colonne landing : plus grand ; compact réservé aux espaces très serrés. */
  variant?: keyof typeof VARIANT_STYLES;
  /** Logo seul (ex. sidebar repliée en mode icône). */
  iconOnly?: boolean;
  /** `stacked` : logo, titre et tagline centrés en colonne (landing pliée). */
  layout?: "horizontal" | "stacked";
};

const CONSTELLATION_AURORA_COLORS = [
  "#2d9a52",
  "#3fad5d",
  "#5ecf8a",
  "#1a6b38",
] as const;

function Wordmark({ wordmarkClass }: { wordmarkClass: string }) {
  return (
    <div className="min-w-0" role="presentation">
      <AuroraText
        className={cn(
          "font-heading font-semibold tracking-tight text-balance",
          wordmarkClass,
        )}
        colors={[...CONSTELLATION_AURORA_COLORS]}
        speed={1.15}
      >
        Constellation
      </AuroraText>
    </div>
  );
}

export function JaegerMysterBrand({
  className,
  variant = "landing",
  iconOnly = false,
  layout = "horizontal",
}: JaegerMysterBrandProps) {
  const s = VARIANT_STYLES[variant];

  if (iconOnly) {
    return (
      <div
        role="img"
        aria-label="Constellation, by JEECE"
        className={cn("flex size-8 items-center justify-center", className)}
      >
        <Image
          alt=""
          aria-hidden
          className="size-8 shrink-0"
          height={32}
          priority={false}
          src={LOGO_SRC}
          unoptimized
          width={32}
        />
      </div>
    );
  }

  if (layout === "stacked") {
    return (
      <div
        role="img"
        aria-label="Constellation, by JEECE"
        className={cn(
          "flex w-full min-w-0 flex-col items-center gap-3 text-center sm:gap-3.5",
          className,
        )}
      >
        <Image
          alt=""
          aria-hidden
          className={cn("shrink-0", s.logoClass)}
          height={s.logoPx}
          priority={variant === "landing"}
          src={LOGO_SRC}
          unoptimized
          width={s.logoPx}
        />
        <Wordmark wordmarkClass={s.wordmark} />
        <div className={cn(s.tagline, "mt-0 w-full text-center")}>by JEECE</div>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label="Constellation, by JEECE"
      className={cn("flex min-w-0 items-center", s.rootGap, className)}
    >
      <Image
        alt=""
        aria-hidden
        className={cn("shrink-0", s.logoClass)}
        height={s.logoPx}
        priority={variant === "landing"}
        src={LOGO_SRC}
        unoptimized
        width={s.logoPx}
      />
      <div className="min-w-0 text-center">
        <Wordmark wordmarkClass={s.wordmark} />
        <div className={cn(s.tagline, "text-center")}>by JEECE</div>
      </div>
    </div>
  );
}
