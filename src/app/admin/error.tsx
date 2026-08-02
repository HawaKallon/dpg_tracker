'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Without this boundary an unhandled Server Action rejection unmounted the whole
 * admin tree and showed Next's generic error page — the user lost everything
 * they had typed and got a digest string instead of a reason.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin]', error);
  }, [error]);

  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 md:p-8 space-y-4">
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
    </div>
  );
}
