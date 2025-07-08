import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { StoryType } from '@prisma/client';
import { randomUUID } from 'crypto';

// GET /api/stories - Fetch all stories
// Force recompilation
export async function GET() {
  try {
    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let currentUser = null;

    if (user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
    }

    // Build where clause based on authentication status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      // Exclude stories in trash tags
      userTag: {
        tag: {
          name: {
            not: {
              startsWith: 'trash_',
            },
          },
        },
      },
    };

    // If user is authenticated, only show stories from followed tags or their own stories
    if (currentUser) {
      whereClause.OR = [
        // Stories from followed tags
        {
          userTag: {
            followers: {
              some: {
                followerUserId: currentUser.id,
              },
            },
          },
        },
        // User's own stories
        {
          authorId: currentUser.id,
        },
      ];
    }

    const stories = await prisma.story.findMany({
      relationLoadStrategy: 'join',
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: true,
        userTag: {
          include: {
            tag: true,
          },
        },
        storyUpvotes: currentUser
          ? {
              where: {
                userId: currentUser.id,
              },
            }
          : false,
        bookmarks: currentUser
          ? {
              where: {
                userId: currentUser.id,
              },
            }
          : false,
        originalStory: {
          include: {
            author: true,
            userTag: {
              include: {
                tag: true,
              },
            },
          },
        },
        _count: {
          select: {
            reposts: true,
          },
        },
      },
    });

    // Transform BigInt to number and add hasUpvoted/hasBookmarked flags
    const serializedStories = stories.map((story) => ({
      ...story,
      upvotes: Number(story.upvotes),
      repostCount: story._count?.reposts || 0,
      hasUpvoted:
        currentUser && 'storyUpvotes' in story && Array.isArray(story.storyUpvotes)
          ? story.storyUpvotes.length > 0
          : false,
      hasBookmarked:
        currentUser && 'bookmarks' in story && Array.isArray(story.bookmarks)
          ? story.bookmarks.length > 0
          : false,
      userTag:
        'userTag' in story && story.userTag
          ? {
              ...story.userTag,
              credibilityScore: Number(story.userTag.credibilityScore),
              followerCount: Number(story.userTag.followerCount),
            }
          : undefined,
      originalStory: story.originalStory
        ? {
            ...story.originalStory,
            upvotes: Number(story.originalStory.upvotes),
            userTag: {
              ...story.originalStory.userTag,
              credibilityScore: Number(story.originalStory.userTag.credibilityScore),
              followerCount: Number(story.originalStory.userTag.followerCount),
            },
          }
        : null,
    }));

    return NextResponse.json(serializedStories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

// POST /api/stories - Create a new story
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
    });

    if (!user) {
      console.error('User not found for email:', authUser.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      content,
      userTagId,
      url,
      title,
      favicon,
      faviconBlobUrl,
      subtag,
      storyType,
      originalStoryId,
      commentary,
    } = body;

    // For reposts, we don't need content, but we need originalStoryId
    if (storyType === 'REPOST') {
      if (!originalStoryId || !userTagId) {
        return NextResponse.json(
          { error: 'Original story and tag are required for reposts' },
          { status: 400 }
        );
      }
    } else if (!content?.trim() || !userTagId) {
      return NextResponse.json({ error: 'Content and tag are required' }, { status: 400 });
    }

    // Validate subtag format if provided
    if (subtag && !/^[a-zA-Z0-9_-]+$/.test(subtag)) {
      return NextResponse.json({ error: 'Invalid subtag format' }, { status: 400 });
    }

    // Verify user owns this tag
    const userTag = await prisma.userTag.findFirst({
      where: {
        id: userTagId,
        userId: user.id,
      },
    });

    if (!userTag) {
      console.error('Invalid tag selection:', { userTagId, userId: user.id });
      return NextResponse.json({ error: 'Invalid tag selection' }, { status: 400 });
    }

    // Determine story type
    let finalStoryType: StoryType = 'TEXT';
    if (storyType === 'REPOST') {
      finalStoryType = 'REPOST';
    } else if (url) {
      finalStoryType = 'URL';
    }

    // Generate a short ID - use timestamp + random for better uniqueness
    const shortId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

    try {
      const story = await prisma.story.create({
        data: {
          id: randomUUID(),
          shortId,
          authorId: user.id,
          userTagId,
          storyType: finalStoryType,
          content: content || null,
          url: url || null,
          title: title || null,
          favicon: favicon || null,
          faviconBlobUrl: faviconBlobUrl || null,
          subtag: subtag || null,
          originalStoryId: originalStoryId || null,
          commentary: commentary || null,
        },
        include: {
          author: true,
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
          originalStory: {
            include: {
              author: true,
              userTag: {
                include: {
                  tag: true,
                },
              },
            },
          },
          _count: {
            select: {
              reposts: true,
            },
          },
        },
      });

      // Transform BigInt to number
      const serializedStory = {
        ...story,
        upvotes: Number(story.upvotes),
        repostCount: story._count?.reposts || 0,
        hasUpvoted: story.storyUpvotes.length > 0,
        userTag: {
          ...story.userTag,
          credibilityScore: Number(story.userTag.credibilityScore),
          followerCount: Number(story.userTag.followerCount),
        },
        originalStory: story.originalStory
          ? {
              ...story.originalStory,
              upvotes: Number(story.originalStory.upvotes),
              userTag: {
                ...story.originalStory.userTag,
                credibilityScore: Number(story.originalStory.userTag.credibilityScore),
                followerCount: Number(story.originalStory.userTag.followerCount),
              },
            }
          : null,
      };

      return NextResponse.json(serializedStory);
    } catch (dbError) {
      console.error('Database error creating story:', dbError);
      // If shortId collision, try once more with a different ID
      if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
        const newShortId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
        const story = await prisma.story.create({
          data: {
            id: randomUUID(),
            shortId: newShortId,
            authorId: user.id,
            userTagId,
            storyType,
            content,
            url: url || null,
            title: title || null,
            favicon: favicon || null,
            faviconBlobUrl: faviconBlobUrl || null,
            subtag: subtag || null,
          },
          include: {
            author: true,
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
        });

        // Transform BigInt to number
        const serializedStory = {
          ...story,
          upvotes: Number(story.upvotes),
          hasUpvoted: story.storyUpvotes.length > 0,
          userTag: {
            ...story.userTag,
            credibilityScore: Number(story.userTag.credibilityScore),
            followerCount: Number(story.userTag.followerCount),
          },
        };

        return NextResponse.json(serializedStory);
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating story:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to create story',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
