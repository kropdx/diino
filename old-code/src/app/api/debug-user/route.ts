import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('[Debug] Starting debug check');

    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    console.log('[Debug] Supabase user:', user?.email);

    if (error || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        supabaseUser: null,
      });
    }

    // Try to fetch user from database
    console.log('[Debug] Attempting database query for:', user.email);

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    console.log('[Debug] Database query result:', {
      found: !!dbUser,
      id: dbUser?.id,
      username: dbUser?.username,
      email: dbUser?.email,
      onboarded: dbUser?.onboarded,
    });

    return NextResponse.json({
      supabaseUserId: user.id,
      supabaseEmail: user.email,
      databaseUser: dbUser
        ? {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            onboarded: dbUser.onboarded,
            hasUsername: !!dbUser.username,
          }
        : null,
      shouldRedirectToOnboarding: !dbUser || !dbUser.username,
    });
  } catch (error) {
    console.error('[Debug] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
