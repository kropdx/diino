import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { StreamChat } from 'https://esm.sh/stream-chat@8.12.2'

const streamApiKey = Deno.env.get('STREAM_API_KEY')!
const streamApiSecret = Deno.env.get('STREAM_API_SECRET')!

serve(async (req) => {
  try {
    const { user_id, email } = await req.json()
    
    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or email' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Initialize Stream Chat server client
    const serverClient = StreamChat.getInstance(streamApiKey, streamApiSecret)
    
    // Create/update the user in Stream Chat
    await serverClient.upsertUser({
      id: user_id,
      name: email.split('@')[0] || 'User',
      role: 'user',
    })
    
    // Get or create the global chat channel
    const channel = serverClient.channel('team', 'global-chat', {
      created_by_id: 'system',
    })
    
    // Ensure channel exists
    try {
      await channel.create()
    } catch (error: any) {
      // Channel might already exist, which is fine
      if (error.code !== 4) {
        throw error
      }
    }
    
    // Add the user to the global channel
    await channel.addMembers([user_id])
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error syncing user to Stream:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to sync user' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 