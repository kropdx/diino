'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { User } from '@supabase/supabase-js'

interface Message {
  id: string
  user_id: string
  content: string
  created_at: string
  user_email?: string
  username?: string
}

interface Profile {
  username: string
  display_name?: string
}

export default function ChatInterface({ user }: { user: User }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial messages
    fetchMessages()
    // Fetch user profile
    fetchUserProfile()

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
    }
  }

  const fetchUserProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setUserProfile(data)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setLoading(true)
    const { error } = await supabase.from('messages').insert({
      content: newMessage,
      user_id: user.id,
      user_email: user.email,
    })

    if (!error) {
      setNewMessage('')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await fetch('/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Diino Chat</h1>
          <p className="text-sm text-muted-foreground">
            Welcome, {userProfile?.display_name || userProfile?.username || user.email}
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.user_id === user.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.user_id === user.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.username ? (
                  <a 
                    href={`/${message.username}`}
                    className="text-xs opacity-70 mb-1 hover:underline inline-block"
                  >
                    @{message.username}
                  </a>
                ) : (
                  <p className="text-xs opacity-70 mb-1">
                    {message.user_email || 'Anonymous'}
                  </p>
                )}
                <p>{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !newMessage.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}