'use client';

import { useEffect, useState } from 'react';
import { StreamChat, Channel as StreamChannel } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from 'stream-chat-react';
import { useAuth } from '@/hooks/useAuth';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import CustomChannelHeader from './CustomChannelHeader';
import CustomMessage from './CustomMessage';

import 'stream-chat-react/dist/css/v2/index.css';

export default function StreamChatInterface() {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const { measureAsync } = usePerformanceMonitor('StreamChatInterface');
  const { user, profile: userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    const initializeChat = async () => {
      // Wait for auth to be loaded
      if (authLoading || !user) {
        if (!authLoading && !user) {
          console.error('No authenticated user');
        }
        return;
      }
      
      const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
      if (!apiKey) {
        console.error('Missing Stream API key');
        return;
      }
      
      const streamClient = StreamChat.getInstance(apiKey);
      
      try {
        // Get token from our server endpoint
        const { token } = await measureAsync(
          'getStreamToken',
          async () => {
            const response = await fetch('/api/stream/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, email: user.email }),
            });
            
            if (!response.ok) throw new Error('Failed to get Stream token');
            
            return response.json();
          },
          { userId: user.id }
        );
        
        await measureAsync(
          'connectStreamUser',
          () => streamClient.connectUser(
            {
              id: user.id,
              name: user.email?.split('@')[0] || 'User',
            },
            token
          )
        );
        
        // Create or get the single global chat channel
        // Using 'team' type which has more permissive default permissions
        const channel = streamClient.channel('team', 'global-chat');
        
        // Watch the channel (creates it if it doesn't exist)
        await measureAsync(
          'watchChannel',
          () => channel.watch()
        );
        
        setClient(streamClient);
        setChannel(channel);
      } catch (error) {
        console.error('Error initializing Stream Chat:', error);
      }
    };
    
    initializeChat();
    
    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, measureAsync]);
  
  if (authLoading || !client || !channel) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500">
            {authLoading ? 'Loading user data...' : 'Connecting to chat...'}
          </p>
        </div>
      </div>
    );
  }
  

  return (
    <div className="h-screen flex flex-col">
      <Chat client={client} theme="str-chat__theme-light">
        <Channel channel={channel}>
          <Window>
            <CustomChannelHeader userProfile={userProfile} />
            <MessageList Message={CustomMessage} />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}