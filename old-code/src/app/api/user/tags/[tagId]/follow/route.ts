import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tagId } = await params;

    // Find the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the user tag exists
    const userTag = await prisma.userTag.findUnique({
      where: { id: tagId },
      include: {
        user: true,
        tag: true,
      },
    });

    if (!userTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Don't allow following your own tags
    if (userTag.userId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot follow your own tags' }, { status: 400 });
    }

    // Check if already following
    const existingFollow = await prisma.userTagFollow.findUnique({
      where: {
        followerUserId_followedUserTagId: {
          followerUserId: currentUser.id,
          followedUserTagId: tagId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this tag' }, { status: 400 });
    }

    // Create the follow relationship
    await prisma.userTagFollow.create({
      data: {
        followerUserId: currentUser.id,
        followedUserTagId: tagId,
      },
    });

    return NextResponse.json({ message: 'Successfully followed tag' });
  } catch (error) {
    console.error('Error following tag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tagId } = await params;

    // Find the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove the follow relationship
    const deleted = await prisma.userTagFollow.delete({
      where: {
        followerUserId_followedUserTagId: {
          followerUserId: currentUser.id,
          followedUserTagId: tagId,
        },
      },
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Not following this tag' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Successfully unfollowed tag' });
  } catch (error) {
    console.error('Error unfollowing tag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
