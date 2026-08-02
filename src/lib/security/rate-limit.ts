import { createClient } from '@/lib/supabase/server';

export class RateLimitError extends Error {
  constructor(bucket: string) {
    super(`Rate limit exceeded for ${bucket}. Try again in a minute.`);
    this.name = 'RateLimitError';
  }
}

export async function rateLimit(
  userId: string,
  bucket: string,
  opts?: { windowSeconds?: number; max?: number }
): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_user_id: userId,
    p_bucket: bucket,
    p_window_seconds: opts?.windowSeconds ?? 60,
    p_max: opts?.max ?? 30,
  });
  if (error) {
    // Fail open on RPC errors — don't block writes if the limiter itself is
    // unavailable. Logged at error level because a missing check_rate_limit()
    // means rate limiting is silently off, which went unnoticed for months.
    console.error(
      `[rate-limit] DISABLED for "${bucket}" — check_rate_limit RPC failed: ${error.message}`
    );
    return;
  }
  if (data === false) throw new RateLimitError(bucket);
}
