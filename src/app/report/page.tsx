import { redirect } from 'next/navigation';
import { getYears } from '@/lib/supabase/queries';

export default async function ReportIndex() {
  const years = await getYears();
  const latest = years[0] ?? new Date().getFullYear();
  redirect(`/report/${latest}`);
}
