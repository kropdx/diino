import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createStreamUser } from '@/lib/stream/server';
import { performanceLogger } from '@/lib/performance-logger';
import { logApiRequest } from '@/lib/api-logger';

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const { userId, email } = await request.json();
    
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
    
    // Create/update Stream user and get token
    const token = await performanceLogger.measureAsync(
      'stream.createUser',
      () => createStreamUser(userId, email),
      { userId, email }
    );
    
    const responseTime = performance.now() - startTime;
    logApiRequest(request, responseTime, 200);
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating Stream token:', error);
    const responseTime = performance.now() - startTime;
    logApiRequest(request, responseTime, 500);
    
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}