"use client";

import {
  CRM_AREA_MAIN,
  CRM_CHART_HEX,
  chartAxisTick,
  chartGridStroke,
  crmChartTooltipStyle,
} from "@myster/_lib/crm-chart-theme";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PRETEXT, PretextBlock } from "@/components/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type CrmOverviewDashCharts = {
  timeline: { date: string; count: number }[];
  statusDistribution: { statut: string; count: number }[];
  sectorDistribution: { secteur: string; count: number }[];
};

export function CrmSectionOverviewCharts({ dash }: { dash: CrmOverviewDashCharts }) {
  return (
    <>
      <div className="grid gap-2 xl:grid-cols-3">
        <Card className="border-brand/15 xl:col-span-2">
          <CardHeader className="border-b border-border/50 py-3 pb-2">
            <PretextBlock
              as="h3"
              metric={PRETEXT.smMedium}
              text="Activité (changements de statut)"
            />
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dash.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="date" tick={chartAxisTick} interval={6} stroke={chartGridStroke} />
                <YAxis tick={chartAxisTick} stroke={chartGridStroke} />
                <Tooltip contentStyle={crmChartTooltipStyle()} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={CRM_AREA_MAIN}
                  fill={CRM_AREA_MAIN}
                  fillOpacity={0.28}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-brand/15">
          <CardHeader className="border-b border-border/50 py-3 pb-2">
            <PretextBlock as="h3" metric={PRETEXT.smMedium} text="Répartition des statuts" />
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dash.statusDistribution}
                  dataKey="count"
                  nameKey="statut"
                  cx="50%"
                  cy="50%"
                  outerRadius={88}
                  label={(props) => {
                    const p = props as unknown as {
                      statut?: string;
                      count?: number;
                    };
                    return `${p.statut ?? ""}: ${p.count ?? 0}`;
                  }}
                >
                  {dash.statusDistribution.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CRM_CHART_HEX[i % CRM_CHART_HEX.length]!}
                      stroke="var(--card)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={crmChartTooltipStyle()} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-brand/15">
        <CardHeader className="border-b border-border/50 py-3 pb-2">
          <PretextBlock as="h3" metric={PRETEXT.smMedium} text="Prospects par secteur (NAF)" />
        </CardHeader>
        <CardContent className="h-[300px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dash.sectorDistribution.slice(0, 12)}
              layout="vertical"
              margin={{ left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis type="number" tick={chartAxisTick} stroke={chartGridStroke} />
              <YAxis
                dataKey="secteur"
                type="category"
                width={100}
                tick={{ ...chartAxisTick, fontSize: 10 }}
                stroke={chartGridStroke}
              />
              <Tooltip contentStyle={crmChartTooltipStyle()} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {dash.sectorDistribution.slice(0, 12).map((_, i) => (
                  <Cell key={i} fill={CRM_CHART_HEX[i % CRM_CHART_HEX.length]!} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
