export const docMatrixStyles = {
  pill: {
    bdSplitShell:
      "inline-flex h-4 min-w-[28px] shrink-0 items-stretch overflow-hidden rounded-sm border border-slate-300/85 text-[7px] font-bold leading-none text-slate-950 dark:border-white/15 dark:text-slate-950",
    bdSplitSegment: "flex min-w-[12px] flex-1 items-center justify-center px-0.5",
    driveOnlyShell:
      "inline-flex h-4 min-w-[22px] shrink-0 items-stretch overflow-hidden rounded-sm border border-slate-300/85 text-[7px] font-bold leading-none text-slate-950 dark:border-white/15 dark:text-slate-950",
    driveOnlySegment: "flex min-w-[20px] flex-1 items-center justify-center px-0.5",
    loadingPulse: "animate-pulse opacity-70",
    loadingPulseStack: "animate-pulse opacity-75",
    pdfRow: "inline-flex items-center gap-0.5 rounded-sm px-0.5 py-px",
    pdfRowReady:
      "bg-emerald-500/18 ring-1 ring-inset ring-emerald-500/45 dark:bg-emerald-500/12 dark:ring-emerald-400/40",
    pdfLabel:
      "w-[15px] shrink-0 text-[8px] font-semibold tracking-tight text-amber-800 dark:text-amber-300",
    pdfCheck:
      "ml-px shrink-0 text-[9px] font-bold leading-none text-emerald-700 dark:text-emerald-300",
    dxRow: "inline-flex items-center gap-0.5 rounded-sm px-0.5 py-px",
    dxLabel:
      "w-[15px] shrink-0 text-[8px] font-semibold tracking-tight text-sky-700 dark:text-sky-300",
    innerStack:
      "inline-flex min-w-0 flex-col gap-0.5 rounded-sm border border-slate-300/85 bg-slate-100/30 p-px dark:border-white/12 dark:bg-white/4",
    trigger:
      "max-w-full rounded-sm border border-transparent text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    triggerInteractive:
      "cursor-pointer hover:border-slate-400/60 hover:bg-slate-100/50 dark:hover:border-white/20 dark:hover:bg-white/8",
    blockCompactOuter: "inline-flex max-w-full flex-col items-center gap-px",
    blockDefaultOuter: "inline-flex max-w-full items-center gap-0.5",
    groupLabelCompact:
      "w-full text-center text-[9px] font-semibold leading-none text-foreground whitespace-normal",
    groupLabelDefault:
      "shrink-0 self-center text-[9px] font-semibold text-foreground whitespace-normal",
  },
  popover: {
    content:
      "w-[min(100vw-2rem,20rem)] max-h-[min(70vh,24rem)] overflow-y-auto rounded-none border-slate-300/85 p-3 text-sm dark:border-white/12",
    title: "text-base font-semibold leading-tight text-foreground",
    stepsSection: "mt-2 border-t border-slate-300/70 pt-2 dark:border-white/10",
    stepsTitle: "text-[11px] font-medium text-foreground",
    stepsStack: "mt-2 flex flex-col gap-2",
    stepRow: "space-y-1",
    stepButton:
      "h-auto w-full justify-start whitespace-normal px-2 py-1.5 text-left text-xs",
    stepDescription: "pl-0.5 text-[11px] text-muted-foreground whitespace-normal wrap-anywhere",
    footer:
      "mt-3 border-t border-slate-300/70 pt-2 text-[11px] leading-snug text-muted-foreground dark:border-white/10 whitespace-normal wrap-anywhere",
  },
  splitPill: {
    row: "inline-flex items-center gap-0.5",
    label: "text-[9px] font-medium text-muted-foreground",
    shell:
      "inline-flex h-[18px] min-w-[30px] shrink-0 items-stretch overflow-hidden rounded-sm border border-slate-300/85 text-[8px] font-bold leading-none text-slate-950 dark:border-white/15 dark:text-slate-950",
    segment: "flex min-w-[12px] flex-1 items-center justify-center px-0.5",
  },
  legend: {
    container:
      "space-y-2 rounded-sm border border-slate-300/70 bg-slate-100/40 p-2 text-[11px] text-muted-foreground dark:border-white/10 dark:bg-white/5",
    title: "text-sm font-medium text-foreground",
    intro: "text-[10px] text-muted-foreground whitespace-normal wrap-anywhere",
    grid: "grid gap-2 sm:grid-cols-2",
    columnTitle: "mb-1 font-semibold text-slate-900 dark:text-slate-100",
    list: "list-inside list-disc space-y-0.5",
    sampleSwatch: "inline-block h-2 w-2 align-middle",
    code: "text-[10px]",
    emphasisDx: "font-medium text-sky-700 dark:text-sky-300",
    emphasisPdf: "font-medium text-amber-800 dark:text-amber-300",
    emphasisStrong: "font-medium text-foreground",
    emphasisReady: "font-medium text-emerald-700 dark:text-emerald-300",
  },
  layout: {
    missions: {
      tableHeadBcDocs: "min-w-[300px] text-center align-middle text-sm",
      tableCellMatrix: "py-1 align-middle",
      matrixColumn: "flex min-w-0 flex-col items-center justify-center gap-y-1",
      missionStripRow:
        "flex w-full min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 border border-slate-300/85 px-1 py-0.5 dark:border-white/8",
      bcRow:
        "flex w-full min-w-0 max-w-full flex-nowrap items-center gap-1 border border-slate-300/85 px-1 py-0.5 dark:border-white/8",
      bcLabel: "shrink-0 text-[10px] font-medium whitespace-normal",
      pillsScroller: "min-w-0 flex-1 overflow-x-auto overflow-y-hidden",
      pillsRow: "flex w-max min-w-0 flex-nowrap items-center gap-1 pr-0.5",
      emptyDash: "text-[10px] text-muted-foreground",
    },
    workflow: {
      legendMargin: "mx-3 mt-2",
      subsectionBorder: "border-b border-slate-300/85 px-3 py-2 dark:border-white/8",
      subsectionTitle: "mb-1 text-[11px] font-medium text-foreground",
      subsectionTitleMuted: "text-muted-foreground font-normal",
      missionPillWrap:
        "flex items-center gap-1 border border-slate-300/85 px-1 py-0.5 text-[11px] dark:border-white/8",
      bcGridCell:
        "flex flex-col gap-0.5 border border-slate-300/85 px-1 py-1 text-[11px] dark:border-white/8",
      missionDocsFlex: "flex flex-wrap gap-1",
    },
  },
} as const;
