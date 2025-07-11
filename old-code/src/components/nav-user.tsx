'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function NavUser() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    email?: string | null;
    user_metadata?: {
      first_name?: string;
    };
  } | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, [supabase]);

  useEffect(() => {
    async function fetchUsername() {
      if (!user) return;

      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    }

    fetchUsername();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

  if (!user) return null;

  const userInitial = user.user_metadata?.first_name?.[0] || user.email?.[0] || 'U';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{userInitial.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-medium">
              {user.user_metadata?.first_name || user.email?.split('@')[0] || 'User'}
            </span>
            <span className="text-xs text-muted-foreground">
              {username ? `@${username.toUpperCase()}` : 'Loading...'}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 px-2">
            Sign out
          </Button>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
