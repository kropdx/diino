import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    if (storyId) {
      // Check if a specific story is bookmarked
      const bookmark = await prisma.bookmark.findUnique({
        where: {
          storyId_userId: {
            storyId,
            userId: dbUser.id,
          },
        },
      });
      return NextResponse.json({ bookmarked: !!bookmark });
    } else {
      // Get all bookmarked stories for the user
      const bookmarks = await prisma.bookmark.findMany({
        where: { userId: dbUser.id },
        include: {
          story: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
              userTag: {
                include: {
                  tag: true,
                },
              },
              _count: {
                select: {
                  storyUpvotes: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform the data to match the expected format
      const stories = bookmarks.map((bookmark) => ({
        ...bookmark.story,
        upvotes: bookmark.story._count.storyUpvotes,
        hasBookmarked: true,
        hasUpvoted: false, // We'd need to check this separately if needed
      }));

      return NextResponse.json(stories);
    }
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

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

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { storyId } = await request.json();

    // Check if story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId: dbUser.id,
        },
      },
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: {
          storyId_userId: {
            storyId: existingBookmark.storyId,
            userId: existingBookmark.userId,
          },
        },
      });
      return NextResponse.json({ bookmarked: false });
    } else {
      // Create bookmark
      await prisma.bookmark.create({
        data: {
          storyId,
          userId: dbUser.id,
        },
      });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Failed to toggle bookmark' }, { status: 500 });
  }
}
