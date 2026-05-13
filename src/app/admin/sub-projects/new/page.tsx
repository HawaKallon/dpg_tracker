import { SubProjectForm } from '../_components/sub-project-form';
import { createSubProject } from '../actions';

export default function NewSubProjectPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sub-projects
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">
          New sub-project
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a program track. Categories and activities can be added afterwards.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <SubProjectForm action={createSubProject} submitLabel="Create sub-project" />
      </div>
    </div>
  );
}
