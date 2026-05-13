import { notFound } from 'next/navigation';
import { ActivityForm } from '../_components/activity-form';
import { updateActivity } from '../actions';
import { createClient } from '@/lib/supabase/server';
import {
  getCategories,
  getDemographicsTaxonomy,
  getLocations,
  getSubCategories,
  getSubProjects,
} from '@/lib/supabase/queries';
import type { Activity } from '@/types/database';

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: activity, error } = await supabase.from('activities').select('*').eq('id', id).single();
  if (error || !activity) notFound();

  const a = activity as Activity;

  const [subs, cats, subCats, locs, taxonomy] = await Promise.all([
    getSubProjects(),
    getCategories(),
    getSubCategories(),
    getLocations(),
    getDemographicsTaxonomy(),
  ]);
  const ageBandOptions = taxonomy.filter((t) => t.kind === 'age_band').map((t) => t.value);
  const roleOptions = taxonomy.filter((t) => t.kind === 'role').map((t) => t.value);

  const updateWithId = updateActivity.bind(null, id);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Activities
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">Edit activity</h1>
        <p className="text-sm text-muted-foreground mt-1">Update fields and save.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <ActivityForm
          action={updateWithId}
          defaults={a}
          subProjects={subs}
          categories={cats}
          subCategories={subCats}
          locations={locs}
          ageBandOptions={ageBandOptions}
          roleOptions={roleOptions}
          submitLabel="Update activity"
        />
      </div>
    </div>
  );
}
