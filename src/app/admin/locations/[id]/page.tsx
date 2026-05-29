import { notFound } from 'next/navigation';
import { LocationForm } from '../_components/location-form';
import { updateLocation } from '../actions';
import { createClient } from '@/lib/supabase/server';
import type { Location } from '@/types/database';

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) notFound();

  const loc = data as Location;
  const updateWithId = updateLocation.bind(null, id);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Locations
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">
          Edit {loc.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Changes appear on the public site within 60 seconds.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <LocationForm
          action={updateWithId}
          defaults={loc}
          submitLabel="Update location"
        />
      </div>
    </div>
  );
}
