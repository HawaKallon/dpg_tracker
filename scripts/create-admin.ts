/* Create the first admin user (since signup is closed by default in this app).
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts admin@example.com somepassword "Full Name"
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const [, , email, password, fullName] = process.argv;
if (!email || !password) {
  console.error('Usage: npx tsx scripts/create-admin.ts <email> <password> [full name]');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }

  console.log('Created user:', data.user?.id, data.user?.email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
