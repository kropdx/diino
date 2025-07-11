import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UnlockScreenClient from './UnlockScreenClient';

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/home');
  }

  return <UnlockScreenClient />;
}
