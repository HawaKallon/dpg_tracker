'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { publicChartColors } from '@/lib/design/tokens';

export type DonutSlice = {
  name: string;
  total_participants: number;
};

export function SubProjectDonut({
  data,
  emptyLabel = 'No participants recorded',
}: {
  data: DonutSlice[];
  emptyLabel?: string;
}) {
  const total = data.reduce((acc, d) => acc + (d.total_participants || 0), 0);
  if (total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total_participants"
          nameKey="name"
          innerRadius={64}
          outerRadius={104}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={publicChartColors.series[i % publicChartColors.series.length]}
              stroke={publicChartColors.tooltipBg}
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: publicChartColors.tooltipBg,
            border: `1px solid ${publicChartColors.tooltipBorder}`,
            borderRadius: 12,
            fontSize: 12,
            color: '#1A1A1A',
          }}
          formatter={(v, n) => [Number(v ?? 0).toLocaleString(), String(n ?? '')]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: publicChartColors.axis }}
          iconType="square"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
