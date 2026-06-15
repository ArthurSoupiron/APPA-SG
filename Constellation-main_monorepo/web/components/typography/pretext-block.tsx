"use client";

import { layout, prepare } from "@chenglou/pretext";
import { type CSSProperties, type Ref, useLayoutEffect, useRef, useState } from "react";
import type { PretextMetric } from "@/lib/pretext-presets";
import { cn } from "@/lib/utils";

export type PretextTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

export type PretextBlockProps = {
  as?: PretextTag;
  text: string;
  metric: PretextMetric;
  className?: string;
} & Omit<
  React.HTMLAttributes<HTMLElement>,
  "as" | "children" | "className" | "dangerouslySetInnerHTML" | "style"
>;

/**
 * Bloc de texte mesuré avec Pretext (`prepare` + `layout`). Point d’entrée unique
 * pour le contenu textuel de l’app (voir ESLint `no-restricted-syntax` hors ce fichier).
 */
export function PretextBlock({ as = "p", text, metric, className, ...rest }: PretextBlockProps) {
  const ref = useRef<HTMLHeadingElement | HTMLParagraphElement | HTMLSpanElement | null>(null);
  const [{ minH, isSmUp }, setLayout] = useState<{
    minH: number | undefined;
    isSmUp: boolean;
  }>({ minH: undefined, isSmUp: false });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia("(min-width: 640px)");

    const measure = () => {
      const smUp = mq.matches;
      const font = smUp ? metric.fontSmUp : metric.fontDefault;
      const lineHeight = smUp ? metric.lineHeightSmUp : metric.lineHeightDefault;
      const w = el.getBoundingClientRect().width;
      if (w < 1) return;
      const prepared = prepare(text, font, { whiteSpace: "normal" });
      const { height } = layout(prepared, w, lineHeight);
      setLayout({
        minH: Math.ceil(height),
        isSmUp: smUp,
      });
    };

    mq.addEventListener("change", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();

    return () => {
      mq.removeEventListener("change", measure);
      ro.disconnect();
    };
  }, [text, metric]);

  const lineHeight = isSmUp ? metric.lineHeightSmUp : metric.lineHeightDefault;
  const style: CSSProperties = {
    minHeight: minH,
    lineHeight: `${lineHeight}px`,
  };

  const shared = {
    ...rest,
    className: cn(className),
    style,
  };

  switch (as) {
    case "h1":
      return (
        <h1 ref={ref as Ref<HTMLHeadingElement>} {...shared}>
          {text}
        </h1>
      );
    case "h2":
      return (
        <h2 ref={ref as Ref<HTMLHeadingElement>} {...shared}>
          {text}
        </h2>
      );
    case "h3":
      return (
        <h3 ref={ref as Ref<HTMLHeadingElement>} {...shared}>
          {text}
        </h3>
      );
    case "h4":
      return (
        <h4 ref={ref as Ref<HTMLHeadingElement>} {...shared}>
          {text}
        </h4>
      );
    case "h5":
      return (
        <h5 ref={ref as Ref<HTMLHeadingElement>} {...shared}>
          {text}
        </h5>
      );
    case "h6":
      return (
        <h6 ref={ref as Ref<HTMLHeadingElement>} {...shared}>
          {text}
        </h6>
      );
    case "span":
      return (
        <span ref={ref as Ref<HTMLSpanElement>} {...shared}>
          {text}
        </span>
      );
    default:
      return (
        <p ref={ref as Ref<HTMLParagraphElement>} {...shared}>
          {text}
        </p>
      );
  }
}
