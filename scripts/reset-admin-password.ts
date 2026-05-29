/* Reset the password for an existing admin user.
 *
 * Usage:
 *   NEW_PASSWORD='your-new-password' npx tsx scripts/reset-admin-password.ts <email>
 *
 * The password is read from the NEW_PASSWORD env var (not a CLI arg) so it
 * doesn't land in your shell history.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const [, , email] = process.argv;
const newPassword = process.env.NEW_PASSWORD;

if (!email) {
  console.error('Usage: NEW_PASSWORD=... npx tsx scripts/reset-admin-password.ts <email>');
  process.exit(1);
}
if (!newPassword) {
  console.error('NEW_PASSWORD env var is required.');
  process.exit(1);
}
if (newPassword.length < 8) {
  console.error('NEW_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function findUserByEmail(targetEmail: string) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  const user = await findUserByEmail(email);
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }

  console.log('Password reset for:', data.user?.id, data.user?.email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
