/* Promote an existing user to super_admin (run once for your account).
 *
 * Usage:
 *   npx tsx scripts/promote-super-admin.ts your@email.com
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const email = process.argv[2]?.trim();
if (!email) {
  console.error('Usage: npx tsx scripts/promote-super-admin.ts <email>');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'super_admin' })
    .eq('email', email)
    .select('id, email, role')
    .maybeSingle();

  if (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
  if (!data) {
    console.error('No profile found for', email);
    process.exit(1);
  }
  console.log('Promoted:', data.email, '→', data.role);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
