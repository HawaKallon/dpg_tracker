'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const PALETTE = ['#1CABE2', '#002759', '#FAB100', '#ec4899', '#5BC15B', '#7B61FF', '#0073b8', '#c2410c'];

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
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v, n) => [Number(v ?? 0).toLocaleString(), String(n ?? '')]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
