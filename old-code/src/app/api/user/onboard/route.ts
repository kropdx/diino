import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, displayName, bio, url } = body;

    // Validate username
    if (!username || username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      );
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser && existingUser.email !== user.email) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // Try to update the user, or create if it doesn't exist
    const dbUser = await prisma.user.upsert({
      where: { email: user.email! },
      update: {
        username,
        displayName: displayName || null,
        bio: bio || null,
        url: url || null,
        onboarded: true,
        updatedAt: new Date(),
      },
      create: {
        email: user.email!,
        username,
        displayName: displayName || null,
        bio: bio || null,
        url: url || null,
        onboarded: true,
      },
    });

    console.log('User onboarded successfully:', dbUser.id);

    return NextResponse.json({ success: true, user: dbUser });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete onboarding',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
