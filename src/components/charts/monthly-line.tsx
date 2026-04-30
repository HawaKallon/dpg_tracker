'use client';

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlyPoint } from '@/lib/supabase/queries';

export function MonthlyLine({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
        <Tooltip
          contentStyle={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="total_participants"
          name="Participants"
          stroke="#1CABE2"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#1CABE2' }}
        />
        <Line
          type="monotone"
          dataKey="activity_count"
          name="Activities"
          stroke="#002759"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 3, fill: '#002759' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
