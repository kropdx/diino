import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getAuthUser() {
  const supabase = await createClient();

  // Use getUser() instead of getSession() for security
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Get full user data from database
  const { data: dbUser } = await supabase.from('User').select('*').eq('email', user.email).single();

  return dbUser;
}

export async function requireAuth() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/sign-in');
  }

  return user;
}
