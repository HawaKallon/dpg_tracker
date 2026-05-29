'use client';

import dynamic from 'next/dynamic';

const Inner = dynamic(() => import('./campus-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full rounded-2xl border border-border bg-muted/40 animate-pulse" />
  ),
});

export function CampusMap({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  return <Inner lat={lat} lng={lng} name={name} />;
}
