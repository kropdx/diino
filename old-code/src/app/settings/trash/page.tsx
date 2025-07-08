import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { LayoutWithSidebar } from '@/components/layout-with-sidebar';
import { TrashManager } from '@/components/trash-manager';

export default async function TrashPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/sign-in');
  }

  // Get the user from database
  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
  });

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <LayoutWithSidebar user={user}>
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Trash</h1>
          <p className="text-muted-foreground">
            Stories that were moved to trash when you deleted tags. You can restore or permanently
            delete them.
          </p>
        </div>

        <TrashManager />
      </main>
    </LayoutWithSidebar>
  );
}
