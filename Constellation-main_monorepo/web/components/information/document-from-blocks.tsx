"use client";

import { PRETEXT, PretextBlock, pretextFixed } from "@/components/typography";
import type { InfoDocument } from "@/lib/information/types";

/**
 * Rend un document d'information (`InfoDocument`) entièrement via PretextBlock.
 * À monter dans un RSC parent (page.tsx) qui lui passe les données.
 */
export function DocumentFromBlocks({ blocks }: { blocks: InfoDocument }) {
  return (
    <div className="flex max-w-[65ch] flex-col gap-y-5">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "h1":
            return (
              <div key={i} className="border-b border-border/60 pb-4">
                <PretextBlock
                  as="h1"
                  text={block.text}
                  metric={PRETEXT.h1Page}
                  className="font-heading text-2xl font-semibold tracking-tight text-foreground"
                />
              </div>
            );
          case "h2":
            return (
              <PretextBlock
                key={i}
                as="h2"
                text={block.text}
                metric={pretextFixed(600, 18, 28)}
                className="scroll-mt-28 border-l-2 border-brand pl-3.5 pt-1 text-lg font-semibold tracking-tight text-foreground"
              />
            );
          case "h3":
            return (
              <PretextBlock
                key={i}
                as="h3"
                text={block.text}
                metric={PRETEXT.smMedium}
                className="pt-0.5 text-sm font-semibold tracking-tight text-brand"
              />
            );
          case "p":
            return (
              <PretextBlock
                key={i}
                as="p"
                text={block.text}
                metric={PRETEXT.base}
                className="text-base leading-relaxed text-muted-foreground"
              />
            );
          case "bullet":
            return (
              <div key={i} className="flex gap-x-3.5 pl-0.5">
                <span
                  className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand/85 ring-2 ring-brand/15 dark:bg-brand dark:ring-brand/25"
                  aria-hidden
                />
                <PretextBlock
                  as="p"
                  text={block.text}
                  metric={PRETEXT.base}
                  className="text-base leading-relaxed text-muted-foreground"
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
