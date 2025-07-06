import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StreamChatInterface from '@/components/StreamChatInterface'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col">
      <StreamChatInterface />
    </main>
  )
}