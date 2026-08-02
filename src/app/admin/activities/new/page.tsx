import { connection } from 'next/server';
import { ActivityForm } from '../_components/activity-form';
import { createActivity } from '../actions';
import {
  getCategories,
  getDemographicsTaxonomy,
  getLocations,
  getSubProjects,
} from '@/lib/supabase/queries';

export default async function NewActivityPage() {
  // Generated here rather than in the client component: it is both the row's
  // primary key and the storage folder photos upload into, so it has to be
  // settled before hydration (a client-side crypto.randomUUID() in a useState
  // initializer produced a different value on each side and a hydration warning).
  // `connection()` opts this page out of prerendering — Cache Components refuses
  // to bake a random value into a static shell, and rightly so: every visitor
  // would share one activity id.
  await connection();
  const activityId = crypto.randomUUID();

  const [subs, cats, locs, taxonomy] = await Promise.all([
    getSubProjects(),
    getCategories(),
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
          activityId={activityId}
          subProjects={subs}
          categories={cats}
          locations={locs}
          ageBandOptions={ageBandOptions}
          roleOptions={roleOptions}
          submitLabel="Create activity"
        />
      </div>
    </div>
  );
}
