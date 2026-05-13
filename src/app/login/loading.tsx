export default function LoginLoading() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:block bg-primary" />
      <section className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="h-8 w-40 rounded bg-muted/50 animate-pulse" />
          <div className="h-4 w-72 rounded bg-muted/40 animate-pulse" />
          <div className="space-y-3 pt-2">
            <div className="h-10 rounded-md bg-muted/40 animate-pulse" />
            <div className="h-10 rounded-md bg-muted/40 animate-pulse" />
            <div className="h-10 rounded-md bg-muted/60 animate-pulse" />
          </div>
        </div>
      </section>
    </main>
  );
}
