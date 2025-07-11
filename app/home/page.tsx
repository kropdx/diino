"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";


// Load stress testing utilities in browser console
if (typeof window !== 'undefined') {
  import('@/lib/stress-test-utils');
}

interface Profile {
  id: string;
  username: string;
}

interface ChatMessage {
  id: number;
  room_id: string;
  sender_id: string;
  content: string;
  client_id: string;
  created_at: string;
  profiles?: Profile;
}

export default function ChatPage() {
  const { profile, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const pending = useRef<Record<string, true>>({});
  const roomId = "00000000-0000-0000-0000-000000000001";
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messageIds = useRef<Set<number | string>>(new Set());
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [debugInfo, setDebugInfo] = useState({ 
    joined: false, 
    subStatus: 'disconnected',
    msgCount: 0,
    lastError: null as string | null
  });
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [oldestMessageTime, setOldestMessageTime] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const lastLoadTimeRef = useRef<number>(0);
  
  // Pagination debugging state
  const [paginationDebug, setPaginationDebug] = useState({
    loadCount: 0,
    lastBatchSize: 0,
    filteredCount: 0,
    duplicatesFound: 0,
    queryTime: '',
    totalMessagesTracked: 0
  });

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Join global room on mount
  useEffect(() => {
    if (!user) return;
    
    // Clear messageIds on mount to avoid stale data
    console.log('[CHAT] Clearing messageIds on mount');
    messageIds.current.clear();
    setMessages([]); // Clear any stale messages
    setDebugInfo(prev => ({ ...prev, msgCount: 0 })); // Reset count
    
    (async () => {
      // First ensure user is in room
      console.log(`[CHAT] Current auth state:`, { userId: user.id, userEmail: user.email });
      
      // Verify we can read our own auth
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('[CHAT] Auth check:', currentUser?.id === user.id ? 'OK' : 'MISMATCH');
      
      // Check if user is already a member before trying to insert
      const { data: existingMember, error: checkError } = await supabase
        .from('chat_members')
        .select('user_id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is expected if the user isn't a member.
        // We only want to log other, unexpected errors.
        console.error('[CHAT] Error checking for member:', checkError);
      }
      
      if (!existingMember) {
        const { error: joinError } = await supabase
         .from("chat_members")
         .insert({ room_id: roomId, user_id: user.id });
        
        if (joinError) {
            console.error('[CHAT] Join room error:', joinError);
            console.error('[CHAT] Join room error details:', JSON.stringify(joinError, null, 2));
            setDebugInfo(prev => ({ ...prev, lastError: joinError.message || JSON.stringify(joinError) }));
        } else {
          console.log('[CHAT] Successfully joined room');
          setDebugInfo(prev => ({ ...prev, joined: true }));
        }
      } else {
        console.log('[CHAT] User is already a member of the room.');
        setDebugInfo(prev => ({ ...prev, joined: true }));
      }

      // Then fetch messages with profiles
      console.log('[CHAT] Fetching initial messages...');
      
      // First verify we're actually a member
      const { data: memberCheck } = await supabase
        .from("chat_members")
        .select("*")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();
      console.log('[CHAT] Member check:', memberCheck);
      
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        console.log(`[CHAT] Fetched ${data.length} messages:`, data);
        
        // Fetch profiles for all unique sender IDs
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        if (senderIds.length > 0) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", senderIds);
          
          if (profileData) {
            const profileMap: Record<string, string> = {};
            profileData.forEach(p => {
              profileMap[p.id] = p.username;
            });
            // Include current user's profile
            if (profile?.username && user?.id) {
              profileMap[user.id] = profile.username;
            }
            setProfiles(profileMap);
          }
        }

        const unique = data.reverse().filter((m) => {
          console.log(`[CHAT] Checking message ${m.client_id}, already exists: ${messageIds.current.has(m.client_id)}`);
          if (messageIds.current.has(m.client_id)) {
            console.log(`[CHAT] Skipping duplicate message ${m.client_id}`);
            return false;
          }
          messageIds.current.add(m.client_id);
          return true;
        });
        console.log(`[CHAT] Adding ${unique.length} unique messages to state`);
        setMessages((prev) => {
          const newMessages = [...prev, ...unique];
          console.log(`[CHAT] Total messages in state: ${newMessages.length}`, newMessages);
          return newMessages;
        });
        setDebugInfo(prev => ({ ...prev, msgCount: prev.msgCount + unique.length }));
        
        // Set oldest message time for pagination
        if (unique.length > 0) {
          const oldestTime = unique[0].created_at;
          console.log('[CHAT DEBUG] Setting initial oldest message time to:', oldestTime);
          setOldestMessageTime(oldestTime);
          setHasMore(data.length === 50); // If we got 50, there might be more
        }
        
        scrollToBottom();
      } else {
        console.log('[CHAT] No messages fetched');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, scrollToBottom]);

  // subscribe to new messages
  useEffect(() => {
    console.log('[CHAT] Setting up realtime subscription...');
    const channel = supabase.channel(`room:${roomId}:${Date.now()}`); // Unique channel name

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload: { new: ChatMessage }) => {
          console.log('[CHAT] Received realtime message:', payload.new);
          const newMsg = payload.new;
          
          // Fetch profile if we don't have it
          setProfiles((currentProfiles) => {
            // Ensure current user's profile is always available
            const updatedProfiles = { ...currentProfiles };
            if (profile?.username && user?.id && !updatedProfiles[user.id]) {
              updatedProfiles[user.id] = profile.username;
            }
            
            if (!updatedProfiles[newMsg.sender_id] && newMsg.sender_id !== user?.id) {
              supabase
                .from("profiles")
                .select("id, username")
                .eq("id", newMsg.sender_id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setProfiles((prev) => ({ ...prev, [data.id]: data.username }));
                  }
                });
            }
            return updatedProfiles;
          });
          
          setMessages((prev) => {
            // Check if message already exists in the array
            const exists = prev.some(m => m.client_id === newMsg.client_id);
            if (exists) {
              console.log(`[CHAT] Skipping duplicate realtime message ${newMsg.client_id}`);
              return prev;
            }
            
            console.log(`[CHAT] Adding message ${newMsg.client_id} to UI`);
            
            // Handle optimistic update reconciliation
            if (pending.current[newMsg.client_id]) {
              delete pending.current[newMsg.client_id];
              console.log(`[CHAT] Reconciling optimistic message ${newMsg.client_id} with server ID ${newMsg.id}`);
              const updated = prev.map((m) => (m.client_id === newMsg.client_id ? newMsg : m));
              console.log(`[CHAT] Messages array after reconciliation:`, updated.length, updated);
              return updated;
            }
            
            // Add new message
            const updated = [...prev, newMsg];
            console.log(`[CHAT] Messages array after realtime add:`, updated.length, updated);
            return updated;
          });
          
          // Update messageIds after state update
          messageIds.current.add(newMsg.client_id);
          setDebugInfo(prev => ({ ...prev, msgCount: prev.msgCount + 1 }));
          scrollToBottom();
        }
      )
      .subscribe((status) => {
        console.log('[CHAT] Subscription status:', status);
        setDebugInfo(prev => ({ ...prev, subStatus: status }));
      });

    return () => {
      console.log('[CHAT] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, scrollToBottom]); // Minimal deps to avoid re-subscribing

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const clientId = crypto.randomUUID();
    console.log(`[CHAT] Sending message with client_id: ${clientId}`);
    const optimistic: ChatMessage = {
      id: -1, // Temporary ID, will be replaced by server
      room_id: roomId,
      sender_id: user.id,
      content: text,
      client_id: clientId,
      created_at: new Date().toISOString(),
    };
    pending.current[clientId] = true;
    messageIds.current.add(clientId); // Track by client_id
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    scrollToBottom();

    try {
      const { data, error } = await supabase.functions.invoke("send-message", {
        body: {
          room_id: roomId,
          content: optimistic.content,
          client_id: clientId,
        },
      });
      if (error) {
        console.error('[CHAT] Send error:', error);
        console.error('[CHAT] Send error details:', JSON.stringify(error, null, 2));
        setDebugInfo(prev => ({ ...prev, lastError: error.message || JSON.stringify(error) }));
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(m => m.client_id !== clientId));
        messageIds.current.delete(clientId);
        delete pending.current[clientId];
      } else {
        console.log('[CHAT] Message sent successfully:', data);
      }
    } catch (err) {
      console.error('[CHAT] Send exception:', err);
      setDebugInfo(prev => ({ ...prev, lastError: err instanceof Error ? err.message : 'Unknown error' }));
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.client_id !== clientId));
      messageIds.current.delete(clientId);
      delete pending.current[clientId];
    }
  };

  const getUsername = (senderId: string) => {
    if (senderId === user?.id) return profile?.username || "User";
    return profiles[senderId] || "User";
  };

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore || !oldestMessageTime) return;
    
    // Prevent rapid-fire loading - enforce minimum 1 second between loads
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 1000) {
      console.log('[CHAT] Skipping load - too soon since last load');
      return;
    }
    
    setLoadingMore(true);
    lastLoadTimeRef.current = now;
    console.log('[CHAT] Loading more messages before:', oldestMessageTime);
    
    // Debug: Track query time
    const queryStart = Date.now();
    
    try {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .lt("created_at", oldestMessageTime)
        .order("created_at", { ascending: false })
        .limit(50);
      
      const queryEnd = Date.now();
      console.log(`[CHAT DEBUG] Query took ${queryEnd - queryStart}ms, returned ${data?.length || 0} messages`);
        
      if (data && data.length > 0) {
        console.log(`[CHAT] Loaded ${data.length} older messages`);
        console.log('[CHAT DEBUG] First message time:', data[0].created_at);
        console.log('[CHAT DEBUG] Last message time:', data[data.length - 1].created_at);
        
        // Fetch profiles for new messages
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const newSenderIds = senderIds.filter(id => !profiles[id] && id !== user?.id);
        
        if (newSenderIds.length > 0) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", newSenderIds);
            
          if (profileData) {
            const newProfiles: Record<string, string> = {};
            profileData.forEach(p => {
              newProfiles[p.id] = p.username;
            });
            // Ensure current user's profile is included
            if (profile?.username && user?.id && !profiles[user.id]) {
              newProfiles[user.id] = profile.username;
            }
            setProfiles(prev => ({ ...prev, ...newProfiles }));
          }
        }
        
        // Save scroll position
        const scrollContainer = scrollContainerRef.current;
        const scrollHeightBefore = scrollContainer?.scrollHeight || 0;
        
        // Debug: Track filtering
        let duplicateCount = 0;
        
        // IMPORTANT: Store the oldest time BEFORE reversing
        const newOldestTime = data[data.length - 1].created_at;
        console.log(`[CHAT DEBUG] New oldest time will be: ${newOldestTime}`);
        
        // Add older messages to beginning
        const uniqueOlder = data.reverse().filter((m) => {
          // Check if already tracked
          if (messageIds.current.has(m.client_id)) {
            duplicateCount++;
            console.log(`[CHAT DEBUG] Duplicate found: ${m.client_id}`);
            return false;
          }
          messageIds.current.add(m.client_id);
          return true;
        });
        
        console.log(`[CHAT DEBUG] Filtered out ${duplicateCount} duplicates, adding ${uniqueOlder.length} unique messages`);
        
        setMessages(prev => [...uniqueOlder, ...prev]);
        setOldestMessageTime(newOldestTime);  // Use the stored value, not from reversed array
        setHasMore(data.length === 50);
        setDebugInfo(prev => ({ ...prev, msgCount: prev.msgCount + uniqueOlder.length }));
        
        // Update pagination debug info
        setPaginationDebug(prev => ({
          loadCount: prev.loadCount + 1,
          lastBatchSize: data.length,
          filteredCount: uniqueOlder.length,
          duplicatesFound: duplicateCount,
          queryTime: `${queryEnd - queryStart}ms`,
          totalMessagesTracked: messageIds.current.size
        }));
        
        // Restore scroll position after DOM update
        requestAnimationFrame(() => {
          if (scrollContainer) {
            const scrollHeightAfter = scrollContainer.scrollHeight;
            const scrollDiff = scrollHeightAfter - scrollHeightBefore;
            scrollContainer.scrollTop = scrollContainer.scrollTop + scrollDiff;
          }
        });
      } else {
        console.log('[CHAT] No more messages to load');
        setHasMore(false);
      }
    } catch (error) {
      console.error('[CHAT] Error loading more messages:', error);
      setPaginationDebug(prev => ({
        ...prev,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, oldestMessageTime, roomId, profiles, user?.id, profile]);

  // Debounced load more function to prevent rapid-fire loading
  const debouncedLoadMore = useCallback(() => {
    // Don't load if already loading or recently loaded
    if (loadingMore) return;
    
    // Add a small delay to prevent multiple triggers
    const timeoutId = setTimeout(() => {
      loadMoreMessages();
    }, 300); // 300ms delay
    
    return () => clearTimeout(timeoutId);
  }, [loadMoreMessages, loadingMore]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          debouncedLoadMore();
        }
      },
      { 
        threshold: 0.5, // Increased from 0.1 to 0.5 (50% visible)
        rootMargin: '100px' // Add margin to trigger slightly before fully visible
      }
    );
    
    const trigger = loadMoreTriggerRef.current;
    if (trigger) {
      observer.observe(trigger);
    }
    
    return () => {
      if (trigger) {
        observer.unobserve(trigger);
      }
    };
  }, [hasMore, loadingMore, debouncedLoadMore]);

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="bg-gray-100 p-2 text-xs rounded">
        Debug: {user?.id?.slice(0,8)} | Room: {roomId.slice(-8)} | Joined: {debugInfo.joined ? 'Y' : 'N'} | 
        Sub: {debugInfo.subStatus} | Msgs: {debugInfo.msgCount}
        {debugInfo.lastError && (
          <div className="text-red-600 mt-1">Error: {debugInfo.lastError}</div>
        )}
      </div>
      <div className="text-xs text-gray-500">
        Messages in state: {messages.length} | IDs: {messages.map(m => m.id > 0 ? m.id : '...').join(', ')}
      </div>
      
      {/* Pagination Debug Panel */}
      <div className="bg-yellow-50 border border-yellow-200 p-2 text-xs rounded space-y-1">
        <div className="font-semibold text-yellow-800">🔍 Pagination Debug</div>
        <div>Load Count: {paginationDebug.loadCount} | Last Batch: {paginationDebug.lastBatchSize} messages</div>
        <div>Filtered to: {paginationDebug.filteredCount} unique | Duplicates: {paginationDebug.duplicatesFound}</div>
        <div>Query Time: {paginationDebug.queryTime} | Total Tracked: {paginationDebug.totalMessagesTracked}</div>
        <div>Oldest Message: {oldestMessageTime ? new Date(oldestMessageTime).toLocaleTimeString() : 'N/A'}</div>
        <div>Has More: {hasMore ? 'YES' : 'NO'} | Loading: {loadingMore ? 'YES' : 'NO'}</div>
      </div>
      
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-2">
        {/* Load more trigger - positioned at the top */}
        <div ref={loadMoreTriggerRef} className="h-1" />
        
        {/* Manual load more button for debugging */}
        {hasMore && !loadingMore && (
          <div className="text-center py-2">
            <Button 
              onClick={() => loadMoreMessages()} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              🔧 Manual Load More (Debug)
            </Button>
          </div>
        )}
        
        {/* Loading indicator */}
        {loadingMore && (
          <div className="text-center py-2 text-sm text-gray-500">
            Loading more messages...
          </div>
        )}
        
        {/* No more messages indicator */}
        {!hasMore && messages.length > 0 && (
          <div className="text-center py-2 text-sm text-gray-500">
            Beginning of conversation
          </div>
        )}
        
        {messages.map((msg) => (
          <Card key={msg.client_id} className="p-2 text-sm">
            <div className="flex justify-between items-start">
              <Link 
                href={`/${getUsername(msg.sender_id)}`}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                @{getUsername(msg.sender_id)}
              </Link>
              <span className="text-xs text-gray-400">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p>{msg.content}</p>
            <div className="text-xs text-gray-300 mt-1">
              ID: {msg.id} | client_id: {msg.client_id.slice(0, 8)}...
            </div>
          </Card>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
} 