import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { LayoutWithSidebar } from '@/components/layout-with-sidebar';

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Get the user from database by email
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser || !dbUser.username) {
    redirect('/onboarding');
  }

  return <LayoutWithSidebar user={dbUser}>{children}</LayoutWithSidebar>;
}
