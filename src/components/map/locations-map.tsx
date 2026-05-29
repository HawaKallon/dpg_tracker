'use client';

import dynamic from 'next/dynamic';
import type { LocationMapPoint } from '@/lib/supabase/query-types';

const Inner = dynamic(() => import('./locations-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full rounded-lg border border-border bg-muted/40 animate-pulse" />
  ),
});

export function LocationsMap({ points }: { points: LocationMapPoint[] }) {
  return <Inner points={points} />;
}
