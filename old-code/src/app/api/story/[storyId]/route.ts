import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // Get current user if authenticated
    const currentUser = authUser?.email
      ? await prisma.user.findUnique({
          where: { email: authUser.email },
        })
      : null;

    // Find the story by shortId
    const story = await prisma.story.findFirst({
      relationLoadStrategy: 'join',
      where: {
        shortId: storyId,
      },
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
          },
        },
        userTag: {
          include: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
        storyUpvotes: currentUser
          ? {
              where: {
                userId: currentUser.id,
              },
              select: {
                userId: true,
              },
            }
          : false,
      },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if user has upvoted
    const hasUpvoted =
      currentUser && 'storyUpvotes' in story && Array.isArray(story.storyUpvotes)
        ? story.storyUpvotes.length > 0
        : false;

    // Serialize the response
    const serializedStory = {
      id: story.id,
      shortId: story.shortId,
      content: story.content,
      createdAt: story.createdAt.toISOString(),
      upvotes: Number(story.upvotes),
      hasUpvoted,
      user: {
        username: story.author.username,
        displayName: story.author.displayName,
      },
      tag: {
        name: story.userTag.tag.name,
      },
    };

    return NextResponse.json(serializedStory);
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 });
  }
}
