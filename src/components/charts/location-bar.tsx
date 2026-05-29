'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LocationBreakdown } from '@/lib/supabase/query-types';

export function LocationBar({ data }: { data: LocationBreakdown[] }) {
  const rows = [...data].reverse();
  return (
    <ResponsiveContainer width="100%" height={Math.max(260, rows.length * 30)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="total_participants" name="Participants" fill="#0f172a" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
