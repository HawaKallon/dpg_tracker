'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SubProjectBreakdown } from '@/lib/supabase/query-types';
import { publicChartColors } from '@/lib/design/tokens';

export function SubProjectBar({ data }: { data: SubProjectBreakdown[] }) {
  const rows = data.map((d) => ({ name: d.name, Male: d.male, Female: d.female }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={rows} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="2 4" stroke={publicChartColors.grid} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: publicChartColors.axis }}
          tickLine={false}
          axisLine={{ stroke: publicChartColors.grid }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fontSize: 11, fill: publicChartColors.axis }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: publicChartColors.tooltipBg,
            border: `1px solid ${publicChartColors.tooltipBorder}`,
            borderRadius: 12,
            fontSize: 12,
            color: '#1A1A1A',
          }}
          cursor={{ fill: 'rgba(31,27,23,0.04)' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: publicChartColors.axis, paddingTop: 8 }}
          iconType="square"
        />
        <Bar dataKey="Male" stackId="g" fill={publicChartColors.male} />
        <Bar
          dataKey="Female"
          stackId="g"
          fill={publicChartColors.female}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
