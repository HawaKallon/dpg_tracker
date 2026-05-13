export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-12 space-y-8">
      <div className="space-y-3">
        <div className="h-3 w-44 rounded-full bg-muted/70 animate-pulse" />
        <div className="h-14 sm:h-20 w-3/4 rounded-2xl bg-muted/60 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-72 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-72 rounded-2xl bg-muted/40 animate-pulse" />
      </div>
    </div>
  );
}
