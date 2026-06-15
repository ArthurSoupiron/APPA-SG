"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export type SortState<C extends string> = {
  column: C | null;
  direction: SortDirection;
};

export function useTableSort<C extends string>(defaultColumn?: C) {
  const [sort, setSort] = useState<SortState<C>>({
    column: defaultColumn ?? null,
    direction: "asc",
  });

  const toggleSort = useCallback((column: C) => {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: "asc" };
      if (prev.direction === "asc") return { column, direction: "desc" };
      return { column: null, direction: "asc" };
    });
  }, []);

  const resetSort = useCallback((column?: C) => {
    setSort({ column: column ?? null, direction: "asc" });
  }, []);

  return { sort, toggleSort, resetSort };
}

function compareSortValues(
  a: string | number | boolean | null | undefined,
  b: string | number | boolean | null | undefined,
): number {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b), "fr", { sensitivity: "base", numeric: true });
}

export function sortByColumn<T, C extends string>(
  rows: T[],
  sort: SortState<C>,
  getValue: (row: T, column: C) => string | number | boolean | null | undefined,
): T[] {
  if (!sort.column) return rows;
  const col = sort.column;
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => compareSortValues(getValue(left, col), getValue(right, col)) * dir);
}

export function useSortedRows<T, C extends string>(
  rows: T[],
  sort: SortState<C>,
  getValue: (row: T, column: C) => string | number | boolean | null | undefined,
): T[] {
  return useMemo(() => sortByColumn(rows, sort, getValue), [rows, sort, getValue]);
}

type SortableTableHeadProps<C extends string> = {
  column: C;
  label: string;
  sort: SortState<C>;
  onSort: (column: C) => void;
  className?: string;
};

export function SortableTableHead<C extends string>({
  column,
  label,
  sort,
  onSort,
  className,
}: SortableTableHeadProps<C>) {
  const active = sort.column === column;
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={cn("whitespace-normal", className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex max-w-full items-center gap-1 rounded-sm text-left text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "text-foreground" : "text-muted-foreground",
        )}
        aria-sort={
          active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <span className="whitespace-normal break-words">{label}</span>
        <Icon className="size-3.5 shrink-0" aria-hidden />
      </button>
    </TableHead>
  );
}
