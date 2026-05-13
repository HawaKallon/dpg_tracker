'use client';

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlyPoint } from '@/lib/supabase/queries';
import { publicChartColors } from '@/lib/design/tokens';

export function MonthlyLine({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="2 4" stroke={publicChartColors.grid} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: publicChartColors.axis }}
          tickLine={false}
          axisLine={{ stroke: publicChartColors.grid }}
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
          cursor={{ stroke: publicChartColors.grid, strokeWidth: 1 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: publicChartColors.axis, paddingTop: 8 }}
          iconType="square"
        />
        <Line
          type="monotone"
          dataKey="total_participants"
          name="Participants"
          stroke={publicChartColors.female}
          strokeWidth={2.5}
          dot={{ r: 4, fill: publicChartColors.female, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="activity_count"
          name="Activities"
          stroke={publicChartColors.male}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 3, fill: publicChartColors.male, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
