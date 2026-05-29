import { notFound } from 'next/navigation';
import { SubProjectForm } from '../_components/sub-project-form';
import { updateSubProject } from '../actions';
import { createClient } from '@/lib/supabase/server';
import type { SubProject } from '@/types/database';

export default async function EditSubProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sub_projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) notFound();

  const sp = data as SubProject;
  const updateWithId = updateSubProject.bind(null, id);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sub-projects
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">
          Edit {sp.name}
        </h1>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <SubProjectForm
          action={updateWithId}
          defaults={sp}
          submitLabel="Update sub-project"
        />
      </div>
    </div>
  );
}
