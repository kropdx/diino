import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    const { storyId } = await params;

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if user has already upvoted
    const existingUpvote = await prisma.storyUpvote.findUnique({
      where: {
        storyId_userId: {
          storyId: storyId,
          userId: user.id,
        },
      },
    });

    let liked = false;
    let newUpvoteCount = Number(story.upvotes);

    if (existingUpvote) {
      // Unlike - remove the upvote
      await prisma.$transaction([
        prisma.storyUpvote.delete({
          where: {
            storyId_userId: {
              storyId: storyId,
              userId: user.id,
            },
          },
        }),
        prisma.story.update({
          where: { id: storyId },
          data: { upvotes: { decrement: 1 } },
        }),
      ]);
      newUpvoteCount--;
    } else {
      // Like - add the upvote
      await prisma.$transaction([
        prisma.storyUpvote.create({
          data: {
            storyId: storyId,
            userId: user.id,
          },
        }),
        prisma.story.update({
          where: { id: storyId },
          data: { upvotes: { increment: 1 } },
        }),
      ]);
      liked = true;
      newUpvoteCount++;
    }

    return NextResponse.json({
      liked,
      upvotes: newUpvoteCount,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
