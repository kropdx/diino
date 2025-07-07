import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StreamChat } from 'stream-chat';
import { performanceLogger } from '@/lib/performance-logger';
import { logApiRequest } from '@/lib/api-logger';

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const { userId } = await request.json();
    
    // Verify the user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await performanceLogger.measureAsync(
      'supabase.auth.getUser',
      () => supabase.auth.getUser(),
      { userId }
    );
    
    if (!user || user.id !== userId) {
      const responseTime = performance.now() - startTime;
      logApiRequest(request, responseTime, 401);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Initialize Stream Chat server client
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      throw new Error('Missing Stream Chat API credentials');
    }
    
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    
    // Create or get the single global channel
    // Using 'team' type which has more permissive default permissions
    const channel = serverClient.channel('team', 'global-chat', {
      created_by_id: 'system', // Use a system user as creator
    });
    
    // Create the channel if it doesn't exist
    try {
      await performanceLogger.measureAsync(
        'stream.createChannel',
        () => channel.create(),
        { userId, channelId: 'global-chat' }
      );
    } catch (error: any) {
      // Channel might already exist, which is fine
      if (error.code !== 4) { // 4 is the error code for "channel already exists"
        throw error;
      }
    }
    
    // Add the user as a member
    await performanceLogger.measureAsync(
      'stream.addMembers',
      () => channel.addMembers([userId]),
      { userId, channelId: 'global-chat' }
    );
    
    const responseTime = performance.now() - startTime;
    logApiRequest(request, responseTime, 200);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating/joining channel:', error);
    const responseTime = performance.now() - startTime;
    logApiRequest(request, responseTime, 500);
    
    return NextResponse.json(
      { error: 'Failed to create/join channel' },
      { status: 500 }
    );
  }
} 