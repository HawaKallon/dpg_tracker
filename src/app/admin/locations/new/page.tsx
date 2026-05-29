import { LocationForm } from '../_components/location-form';
import { createLocation } from '../actions';

export default function NewLocationPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Locations
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">New location</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Register a campus, hub, or venue so activities can be linked to it.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <LocationForm action={createLocation} submitLabel="Create location" />
      </div>
    </div>
  );
}
