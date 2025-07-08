import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { LayoutWithSidebar } from '@/components/layout-with-sidebar';
import { TrashSection } from '@/components/trash-section';

export default async function SettingsPage() {
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
      <main className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        {/* Trash Management Section */}
        <TrashSection />

        {/* Future settings sections */}
        <div className="pt-6 border-t">
          <p className="text-muted-foreground">More settings coming soon...</p>
        </div>
      </main>
    </LayoutWithSidebar>
  );
}
