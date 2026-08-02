'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-start justify-center gap-4 px-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="size-5 text-destructive mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-accent">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            {error.message || 'An unexpected error occurred.'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
          )}
        </div>
      </div>
      <Button onClick={reset} variant="outline" size="sm">
        <RotateCw className="size-4" />
        Try again
      </Button>
    </main>
  );
}
