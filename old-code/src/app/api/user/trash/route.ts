import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

// GET /api/user/trash - Get user's trash stories and count
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find user's trash tag
    const trashTagName = `trash_${user.id}`;
    const trashUserTag = await prisma.userTag.findFirst({
      where: {
        userId: user.id,
        tag: {
          name: trashTagName,
        },
      },
      include: {
        tag: true,
      },
    });

    if (!trashUserTag) {
      return NextResponse.json({
        count: 0,
        stories: [],
      });
    }

    // Get all stories in trash with original tag information
    const trashedStories = await prisma.story.findMany({
      where: {
        userTagId: trashUserTag.id,
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
            tag: true,
          },
        },
        storyUpvotes: {
          where: {
            userId: user.id,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get original CanonicalTags for all stories that have originalUserTagId
    // Note: originalUserTagId now stores CanonicalTag IDs (not UserTag IDs)
    const originalTagIds = trashedStories
      .map((story) => story.originalUserTagId)
      .filter(Boolean) as string[];

    const originalTags =
      originalTagIds.length > 0
        ? await prisma.canonicalTag.findMany({
            where: {
              id: {
                in: originalTagIds,
              },
            },
          })
        : [];

    // Create a map for quick lookup
    const originalTagMap = new Map(originalTags.map((tag) => [tag.id, tag]));

    const stories = trashedStories.map((story) => {
      // Get original tag info if available
      const originalTag = story.originalUserTagId
        ? originalTagMap.get(story.originalUserTagId)
        : null;

      return {
        ...story,
        upvotes: Number(story.upvotes),
        hasUpvoted: story.storyUpvotes.length > 0,
        userTag: {
          ...story.userTag,
          credibilityScore: Number(story.userTag.credibilityScore),
          followerCount: Number(story.userTag.followerCount),
          // Override the tag name with original tag name if available
          tag: {
            ...story.userTag.tag,
            name: originalTag ? originalTag.name : story.userTag.tag.name,
          },
        },
        // Keep the original tag info for potential restoration
        originalTag: originalTag
          ? {
              id: originalTag.id,
              name: originalTag.name,
            }
          : null,
      };
    });

    return NextResponse.json({
      count: stories.length,
      stories,
    });
  } catch (error) {
    console.error('Error fetching trash:', error);
    return NextResponse.json({ error: 'Failed to fetch trash' }, { status: 500 });
  }
}
