import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const names = [
    'Fourah Bay College',
    'Fourah Bay College Digital Learningg Hub',
    'Fourah Bay College Outreach',
    'Njala University - Bo Campus',
    'Njala - Bo Campus',
    'Limkokwing University',
    'MoCTI + Limkokwing University',
  ];

  const { data, error } = await supabase
    .from('locations')
    .select('id, name')
    .in('name', names);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  for (const row of data ?? []) {
    console.log(`'${row.id}',  -- ${row.name}`);
  }
}

main();
