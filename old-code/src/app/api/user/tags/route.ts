import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { userCache } from '@/lib/cache';
import { User, UserTag, CanonicalTag } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';

// Note: Edge Runtime requires special setup with Prisma (Accelerate or adapters)
// For now, we'll use Node.js runtime which is still fast in production
// export const runtime = 'edge';

// Helper function to serialize BigInt values
interface UserTagWithTag extends UserTag {
  tag: CanonicalTag;
}

interface UserTagWithStoryCount extends UserTagWithTag {
  storyCount: number;
}

function serializeUserTag(userTag: UserTagWithStoryCount) {
  return {
    ...userTag,
    credibilityScore: userTag.credibilityScore.toString(),
    followerCount: userTag.followerCount.toString(),
    tag: {
      ...userTag.tag,
    },
    storyCount: userTag.storyCount,
  };
}

// Helper function to get user with caching
async function getUserByEmail(email: string): Promise<User | null> {
  const cacheKey = `user:email:${email}`;

  // Check cache first
  const cachedUser = userCache.get<User>(cacheKey);
  if (cachedUser) {
    console.log('[Cache] User hit:', email);
    return cachedUser;
  }

  // Cache miss - fetch from database
  console.log('[Cache] User miss:', email);
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    // Cache for 5 minutes
    userCache.set(cacheKey, user);
  }

  return user;
}

// Warm the database connection on module load
if (process.env.NODE_ENV === 'production') {
  prisma.$queryRaw`SELECT 1`
    .then(() => console.log('[API] Database connection warmed'))
    .catch(console.error);
}

// GET /api/user/tags - Get all tags for the current user
export async function GET(request: NextRequest) {
  try {
    // Use Supabase auth
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get username from query params (for viewing other users' tags)
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // Find the user
    let user;
    if (username) {
      // For other users, we don't cache (less frequent)
      user = await prisma.user.findUnique({
        where: { username },
      });
    } else {
      // For current user, find by email
      user = await prisma.user.findUnique({
        where: { email: authUser.email! },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all user tags with canonical tag names (excluding trash tags)
    const userTags = await prisma.userTag.findMany({
      relationLoadStrategy: 'join',
      where: {
        userId: user.id,
        tag: {
          name: {
            not: {
              startsWith: 'trash_',
            },
          },
        },
      },
      include: {
        tag: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get story counts for each user tag
    const userTagsWithCounts = await Promise.all(
      userTags.map(async (userTag) => {
        const storyCount = await prisma.story.count({
          where: { userTagId: userTag.id },
        });
        return {
          ...userTag,
          storyCount,
        };
      })
    );

    // Serialize BigInt values
    const serializedUserTags = userTagsWithCounts.map(serializeUserTag);

    return NextResponse.json(serializedUserTags);
  } catch (error) {
    console.error('Error fetching user tags:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tags',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/user/tags - Create a new tag for the current user
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const timings: Record<string, number> = {};

  try {
    // Step 1: Auth check - using Supabase auth
    const authStart = Date.now();
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();
    timings.auth = Date.now() - authStart;

    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Parse request body
    const parseStart = Date.now();
    const body = await request.json();
    const { tagName } = body;
    timings.parseBody = Date.now() - parseStart;

    if (!tagName || typeof tagName !== 'string') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    // Normalize tag name (lowercase, trim)
    const normalizedTagName = tagName.trim().toLowerCase();

    if (normalizedTagName.length === 0) {
      return NextResponse.json({ error: 'Tag name cannot be empty' }, { status: 400 });
    }

    // Step 3: Get the current user (with caching)
    const getUserStart = Date.now();
    const user = await getUserByEmail(authUser.email!);
    timings.getUser = Date.now() - getUserStart;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Step 4-6: Use a transaction for tag operations
    const transactionStart = Date.now();
    const result = await prisma.$transaction(async (tx) => {
      // Check/create canonical tag
      let canonicalTag = await tx.canonicalTag.findUnique({
        where: { name: normalizedTagName },
      });

      if (!canonicalTag) {
        canonicalTag = await tx.canonicalTag.create({
          data: { name: normalizedTagName },
        });
      }

      // Check if user already has this tag
      const existingUserTag = await tx.userTag.findFirst({
        where: {
          userId: user.id,
          tagId: canonicalTag.id,
        },
      });

      if (existingUserTag) {
        throw new Error('DUPLICATE_TAG');
      }

      // Create user tag
      const userTag = await tx.userTag.create({
        data: {
          userId: user.id,
          tagId: canonicalTag.id,
        },
        include: {
          tag: true,
        },
      });

      return userTag;
    });
    timings.transaction = Date.now() - transactionStart;

    // Add story count (new tags will have 0 stories)
    const resultWithCount = {
      ...result,
      storyCount: 0,
    };

    // Serialize BigInt values
    const serializedUserTag = serializeUserTag(resultWithCount);

    // Log total time and breakdown
    timings.total = Date.now() - startTime;
    console.log('Tag creation performance:', {
      tagName: normalizedTagName,
      authMethod: 'supabase', // Using Supabase auth
      timings,
      totalMs: timings.total,
    });

    return NextResponse.json(serializedUserTag, { status: 201 });
  } catch (error) {
    console.error('Error creating user tag:', error);
    console.log('Failed after', Date.now() - startTime, 'ms');

    if (error instanceof Error && error.message === 'DUPLICATE_TAG') {
      return NextResponse.json({ error: 'You already have this tag' }, { status: 409 });
    }

    return NextResponse.json(
      {
        error: 'Failed to create tag',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
