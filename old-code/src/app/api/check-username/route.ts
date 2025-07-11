import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  // Validate username format (alphanumeric, underscore, hyphen, 3-20 chars)
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return NextResponse.json(
      {
        available: false,
        error:
          'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens',
      },
      { status: 200 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { email: true },
    });

    // Username is available if no user exists or if it's the current user's username
    const available = !existingUser || existingUser.email === user.email;

    return NextResponse.json({ available });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ error: 'Failed to check username' }, { status: 500 });
  }
}
