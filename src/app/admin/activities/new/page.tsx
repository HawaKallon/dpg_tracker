import { ActivityForm } from '../_components/activity-form';
import { createActivity } from '../actions';
import {
  getCategories,
  getDemographicsTaxonomy,
  getLocations,
  getSubCategories,
  getSubProjects,
} from '@/lib/supabase/queries';

export default async function NewActivityPage() {
  const [subs, cats, subCats, locs, taxonomy] = await Promise.all([
    getSubProjects(),
    getCategories(),
    getSubCategories(),
    getLocations(),
    getDemographicsTaxonomy(),
  ]);
  const ageBandOptions = taxonomy.filter((t) => t.kind === 'age_band').map((t) => t.value);
  const roleOptions = taxonomy.filter((t) => t.kind === 'role').map((t) => t.value);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Activities
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">New activity</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Log a meetup, training, or program event.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <ActivityForm
          action={createActivity}
          subProjects={subs}
          categories={cats}
          subCategories={subCats}
          locations={locs}
          ageBandOptions={ageBandOptions}
          roleOptions={roleOptions}
          submitLabel="Create activity"
        />
      </div>
    </div>
  );
}
