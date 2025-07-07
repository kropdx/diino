import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomChatInterface from '@/components/CustomChatInterface'
import { AppLayout } from '@/components/AppLayout'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <AppLayout>
      <CustomChatInterface />
    </AppLayout>
  )
}