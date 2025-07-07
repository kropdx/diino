'use client';

import Link from 'next/link';
import { useChannelStateContext } from 'stream-chat-react';
import { Button } from '@/components/ui/button';

interface CustomChannelHeaderProps {
  userProfile: {
    username: string;
    email: string;
  } | null;
}

export default function CustomChannelHeader({ userProfile }: CustomChannelHeaderProps) {
  const { channel } = useChannelStateContext();

  return (
    <div className="str-chat__header-livestream">
      <div className="flex items-center justify-between w-full px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            Global Chat
          </h2>
          <span className="text-sm text-muted-foreground">
            {Object.keys(channel?.state?.members || {}).length} members
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {userProfile && (
            <Link href={`/${userProfile.username}`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {userProfile.username[0].toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:inline">{userProfile.username}</span>
              </Button>
            </Link>
          )}
          
          <Link href="/logout">
            <Button variant="ghost" size="sm">
              Logout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}