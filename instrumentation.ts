// Next.js auto-detects this file and calls `register()` once per server worker.
//
// What this filters
// -----------------
// With `cacheComponents: true` in next.config.ts, Next 16 runs a "prospective"
// prerender to warm caches, then deliberately aborts those render controllers
// (node_modules/next/dist/server/app-render/app-render.js:767-786 and 2624-2632).
// Most of those aborts are caught and suppressed by Next's built-in
// unhandled-rejection filter, but only when the rejection surfaces inside a
// `prerender`-typed work-unit context
// (node_modules/next/dist/server/node-environment-extensions/unhandled-rejection.external.js:442-468).
//
// Async work that escapes that AsyncLocalStorage context — common with the
// fetch wrapper used by @supabase/ssr — bypasses the filter, lands in the dev
// server's logger via setup-dev-bundler.js:899-917 → console.error, and prints
// as a stray "AbortError: This operation was aborted" line after every 200.
//
// Scope
// -----
// We wrap console.error in development only, and only drop log calls whose
// last argument is an AbortError with the exact prerender-abort shape AND a
// stack composed entirely of node_modules / ignore-listed frames. Any abort
// that touches our source tree — or any other error — passes through.
//
// Disable by deleting this file or setting NEXT_KEEP_ABORT_LOGS=1.

export function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NODE_ENV !== 'development') return;
  if (process.env.NEXT_KEEP_ABORT_LOGS === '1') return;

  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (args.length > 0 && isBenignPrerenderAbort(args[args.length - 1])) {
      return;
    }
    originalConsoleError(...args);
  };
}

function isBenignPrerenderAbort(value: unknown): boolean {
  if (!(value instanceof Error)) return false;
  if (value.name !== 'AbortError') return false;
  if (value.message !== 'This operation was aborted') return false;
  if ((value as { code?: number }).code !== 20) return false;

  const stack = value.stack ?? '';
  const lines = stack.split('\n').slice(1);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith('at ')) continue;
    if (line.includes('node_modules')) continue;
    if (line.includes('ignore-listed frames')) continue;
    if (line.startsWith('at node:') || line.includes('(node:')) continue;
    return false;
  }
  return true;
}
