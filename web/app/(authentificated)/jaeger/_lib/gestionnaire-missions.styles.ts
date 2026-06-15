export const gestionnaireMissionsStyles = {
  shell: "flex-col rounded-none! border-x-0 border-b-0 shadow-none",
  sidebarList: "space-y-0.5 p-1",
  contentArea: "min-h-0 flex-1 overflow-auto p-0",
  sectionContainer:
    "border border-slate-300/85 bg-slate-50/70 dark:border-white/8 dark:bg-background/65",
  sectionHeader:
    "flex items-center justify-between gap-3 border-b border-slate-300/85 px-4 py-3 dark:border-white/8",
  cardSoft:
    "border border-slate-300/85 bg-slate-50/70 dark:border-white/8 dark:bg-background/65",
  kpiGrid: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
  infoSubline: "text-xs italic text-muted-foreground whitespace-normal wrap-anywhere",
  actionButton: "rounded-none",
  statusSquare: "h-4 w-4 border border-slate-300/85 dark:border-white/15",
  statusGray: "bg-slate-400/40 dark:bg-slate-500/40",
  statusGreen: "bg-emerald-500/80 dark:bg-emerald-500/75",
  statusOrange: "bg-orange-500/80 dark:bg-orange-500/75",
  statusRed: "bg-red-500/80 dark:bg-red-500/75",
  statusSquareSplit: "min-w-[28px]",
  bddAbsent: "bg-slate-500/82 dark:bg-slate-500/74",
  bddPendingDrive: "bg-cyan-600/85 dark:bg-cyan-600/78",
  bddSynced: "bg-indigo-600/88 dark:bg-indigo-600/82",
  bddInconsistency: "bg-violet-600/88 dark:bg-violet-600/82",
  bddError: "bg-fuchsia-600/88 dark:bg-fuchsia-500/82",
  driveAbsent: "bg-stone-500/82 dark:bg-stone-500/74",
  drivePresent: "bg-emerald-600/88 dark:bg-emerald-600/82",
  driveTrashed: "bg-red-600/88 dark:bg-red-600/82",
  driveInconsistency: "bg-amber-500/88 dark:bg-amber-500/80",
} as const;

export const jaegerExplorerStyles = {
  shell: "flex min-h-0 w-full min-w-0 flex-1 flex-col",
  sidebarHeader:
    "flex shrink-0 items-stretch border-b border-slate-300/85 dark:border-white/8",
  sidebarTitle: "text-sm font-semibold whitespace-normal",
  sidebarToggle: "ml-auto h-7 w-7 shrink-0 rounded-none",
  sidebar:
    "flex shrink-0 flex-col overflow-hidden border-r border-slate-300/85 bg-slate-50/50 dark:border-white/8 dark:bg-background/40",
  sidebarCollapsed: "items-center",
  sidebarScroll: "h-full min-h-0",
  content: "min-h-0 min-w-0 flex-1 overflow-hidden",
  tableButtonBase:
    "relative flex w-full items-center gap-2 border px-2 py-2 text-left transition-colors",
  tableButtonExpanded: "justify-start",
  tableButtonCollapsed: "justify-center px-0",
  tableButtonInactive: "text-slate-700 dark:text-slate-200",
  tableButtonIcon: "h-4 w-4 shrink-0",
  tableButtonTitle: "min-w-0 text-xs font-medium whitespace-normal wrap-anywhere",
  tableButtonGlow: "pointer-events-none absolute inset-y-1 left-0 w-0.5 opacity-0",
} as const;
