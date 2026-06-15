export type GroupPermColor = {
  dot: string;
  border: string;
  bg: string;
  text: string;
};

export const GROUP_PERM_COLORS: GroupPermColor[] = [
  {
    dot: "bg-blue-500",
    border: "border-blue-500/60",
    bg: "bg-blue-500/12",
    text: "text-blue-700 dark:text-blue-300",
  },
  {
    dot: "bg-emerald-500",
    border: "border-emerald-500/60",
    bg: "bg-emerald-500/12",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  {
    dot: "bg-amber-500",
    border: "border-amber-500/60",
    bg: "bg-amber-500/12",
    text: "text-amber-800 dark:text-amber-300",
  },
  {
    dot: "bg-violet-500",
    border: "border-violet-500/60",
    bg: "bg-violet-500/12",
    text: "text-violet-700 dark:text-violet-300",
  },
  {
    dot: "bg-rose-500",
    border: "border-rose-500/60",
    bg: "bg-rose-500/12",
    text: "text-rose-700 dark:text-rose-300",
  },
  {
    dot: "bg-cyan-500",
    border: "border-cyan-500/60",
    bg: "bg-cyan-500/12",
    text: "text-cyan-800 dark:text-cyan-300",
  },
  {
    dot: "bg-orange-500",
    border: "border-orange-500/60",
    bg: "bg-orange-500/12",
    text: "text-orange-800 dark:text-orange-300",
  },
  {
    dot: "bg-lime-600",
    border: "border-lime-600/60",
    bg: "bg-lime-600/12",
    text: "text-lime-800 dark:text-lime-300",
  },
];

export function groupPermColorAt(index: number): GroupPermColor {
  return GROUP_PERM_COLORS[index % GROUP_PERM_COLORS.length]!;
}
