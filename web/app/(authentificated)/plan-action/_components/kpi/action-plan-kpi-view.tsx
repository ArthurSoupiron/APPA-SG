"use client";

import { useMemo } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import { POLE_LABELS, STATUS_COLORS, STATUS_OPTIONS } from "../../_lib/action-plan-constants";
import type { ActionPlanTree } from "../../_lib/action-plan-types";

type FlatItem = {
  status: string;
  campus: string | null;
  pole: string;
  axisTitle: string;
  priority: number | null;
};

function flattenPlan(plan: ActionPlanTree): FlatItem[] {
  const items: FlatItem[] = [];
  for (const axis of plan) {
    for (const subAxis of axis.subAxes) {
      for (const smart of subAxis.smarts) {
        for (const action of smart.actions) {
          if (action.subActions.length === 0) {
            const poles = action.action.poles.length ? action.action.poles : ["—"];
            for (const pole of poles) {
              items.push({
                status: action.action.status,
                campus: action.action.campus,
                pole,
                axisTitle: axis.axis.title,
                priority: action.action.priority,
              });
            }
          } else {
            for (const subAction of action.subActions) {
              const poles = subAction.subAction.poles.length
                ? subAction.subAction.poles
                : ["—"];
              for (const pole of poles) {
                items.push({
                  status: subAction.subAction.status,
                  campus: subAction.subAction.campus,
                  pole,
                  axisTitle: axis.axis.title,
                  priority: subAction.subAction.priority,
                });
              }
            }
          }
        }
      }
    }
  }
  return items;
}

function countByKey(items: FlatItem[], key: keyof FlatItem) {
  const map = new Map<string, number>();
  for (const item of items) {
    const v = String(item[key] ?? "—");
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

export function ActionPlanKpiView({ plan }: { plan: ActionPlanTree }) {
  const items = useMemo(() => flattenPlan(plan), [plan]);

  const statusData = useMemo(() => {
    const counts = countByKey(items, "status");
    return counts.map((d) => ({
      ...d,
      label: STATUS_OPTIONS.find((s) => s.value === d.name)?.label ?? d.name,
      fill: STATUS_COLORS[d.name as keyof typeof STATUS_COLORS] ?? "var(--chart-3)",
    }));
  }, [items]);

  const poleData = useMemo(() => {
    return countByKey(items, "pole").map((d) => ({
      ...d,
      label: POLE_LABELS[d.name as keyof typeof POLE_LABELS] ?? d.name,
    }));
  }, [items]);

  const campusData = useMemo(() => countByKey(items, "campus"), [items]);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aucune donnée pour les indicateurs.</p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-sm font-medium">Répartition par statut</h3>
        <ChartContainer
          config={Object.fromEntries(
            STATUS_OPTIONS.map((s) => [s.value, { label: s.label, color: STATUS_COLORS[s.value] }]),
          )}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={statusData} dataKey="value" nameKey="label" innerRadius={50}>
              {statusData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-sm font-medium">Répartition par pôle</h3>
        <ChartContainer config={{ value: { label: "Nombre" } }} className="h-[280px] w-full">
          <BarChart data={poleData} layout="vertical" margin={{ left: 8 }}>
            <XAxis type="number" />
            <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--chart-1)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
      <div className="rounded-lg border p-4 lg:col-span-2">
        <h3 className="mb-4 text-sm font-medium">Répartition par campus</h3>
        <ChartContainer config={{ value: { label: "Nombre" } }} className="h-[200px] w-full">
          <BarChart data={campusData}>
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--chart-2)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
