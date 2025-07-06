'use client';

import { useEffect, useState } from 'react';
import { StreamChat, Channel as StreamChannel } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from 'stream-chat-react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

import 'stream-chat-react/dist/css/v2/index.css';

export default function StreamChatInterface() {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        return;
      }
      
      setUser(user);
      
      const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
      if (!apiKey) {
        console.error('Missing Stream API key');
        return;
      }
      
      const streamClient = StreamChat.getInstance(apiKey);
      
      try {
        // Get token from our server endpoint
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email: user.email }),
        });
        
        if (!response.ok) throw new Error('Failed to get Stream token');
        
        const { token } = await response.json();
        
        await streamClient.connectUser(
          {
            id: user.id,
            name: user.email?.split('@')[0] || 'User',
          },
          token
        );
        
        const channel = streamClient.channel('messaging', 'general');
        
        await channel.watch();
        
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
  }, []);
  
  if (!client || !channel) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500">Connecting to chat...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      <Chat client={client} theme="str-chat__theme-light">
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}