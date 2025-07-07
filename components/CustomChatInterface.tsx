'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { StreamChat, Channel as StreamChannel, MessageResponse, LocalMessage, EventHandler } from 'stream-chat';
import { getStreamClient } from '@/lib/stream/client';

import { useAuth } from '@/hooks/useAuth';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowUp, Plus } from 'lucide-react';

export default function CustomChatInterface() {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  type ChatMsg = MessageResponse | LocalMessage;
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [messageText, setMessageText] = useState('');
  const [streamLoading, setStreamLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { measureAsync } = usePerformanceMonitor('CustomChatInterface');
  const { user, profile: userProfile, loading: authLoading } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    let handleNewMessage: EventHandler | null = null;
    let currentChannel: StreamChannel | null = null;

    const initializeChat = async () => {
      const streamClient = getStreamClient();

      // Case 1: No user is authenticated. Disconnect and clear everything.
      if (!user) {
        if (streamClient.userID) {
          await streamClient.disconnectUser();
        }
        if (mounted) {
          setClient(null);
          setChannel(null);
          setMessages([]);
          setStreamLoading(false);
        }
        return;
      }

      // Case 2: A different user is connected. Disconnect them first.
      if (streamClient.userID && streamClient.userID !== user.id) {
        await streamClient.disconnectUser();
      }

      // Case 3: No user is connected. Connect the current user with a token provider.
      if (!streamClient.userID) {
        const tokenProvider = async () => {
          const response = await fetch('/api/stream/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, email: user.email }),
          });
          if (!response.ok) throw new Error('Failed to get Stream token');
          const { token } = await response.json();
          return token;
        };

        await measureAsync('connectStreamUser', () =>
          streamClient.connectUser(
            {
              id: user.id,
              name: user.email?.split('@')[0] || 'User',
            },
            tokenProvider
          )
        );
      }

      if (!mounted) return;

      // Ensure user is added to the channel server-side first
      try {
        await fetch('/api/stream/channel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (error) {
        console.error('Error ensuring channel membership:', error);
      }

      // The client caches channel instances internally.
      // Connect to the single global chat channel
      currentChannel = streamClient.channel('team', 'global-chat');

      if (!currentChannel.initialized) {
        await measureAsync('watchChannel', () => currentChannel!.watch());
      }

      if (!mounted) return;

      const state = currentChannel.state;
      setMessages(state.messages as ChatMsg[]);

      handleNewMessage = (event) => {
        if (event.message && mounted) {
          setMessages((prev) => [...prev, event.message as ChatMsg]);
        }
      };
      currentChannel.on('message.new', handleNewMessage);

      setClient(streamClient);
      setChannel(currentChannel);
      setStreamLoading(false);
    };

    const run = async () => {
      try {
        if (!authLoading) {
          await initializeChat();
        }
      } catch (error) {
        console.error('Error initializing Stream Chat:', error);
        if (mounted) {
          setStreamLoading(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
      if (currentChannel && handleNewMessage) {
        currentChannel.off('message.new', handleNewMessage);
      }
    };
  }, [authLoading, user, measureAsync]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();

    
    if (!channel || !messageText.trim()) return;
    
    try {
      await channel.sendMessage({
        text: messageText,
      });
      
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  if (authLoading || streamLoading) {
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
    <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm h-full">
      {/* Header */}
      <div className="px-6 flex flex-row items-center">
        <div className="flex items-center gap-4">
          <Avatar className="size-8">
            <AvatarFallback>
              {userProfile?.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm leading-none font-medium">
              {userProfile?.username || 'Loading...'}
            </p>
            <p className="text-muted-foreground text-xs">
              {userProfile?.email || ''}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="ml-auto size-8 rounded-full"
          asChild
        >
          <Link href="/logout">
            <Plus className="h-4 w-4" />
            <span className="sr-only">New message</span>
          </Link>
        </Button>
      </div>
      
      {/* Messages */}
      <div className="px-6 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="flex flex-col gap-4">
            {messages.map((message) => {
              const isMe = message.user?.id === client?.user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ${
                    isMe
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  {message.text}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      
      {/* Input */}
      <div className="flex items-center px-6">
        <form onSubmit={sendMessage} className="relative w-full">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 pr-10"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!messageText.trim()}
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2 rounded-full"
          >
            <ArrowUp className="size-3.5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}