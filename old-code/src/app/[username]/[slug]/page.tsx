import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { LayoutWithSidebar } from '@/components/layout-with-sidebar';
import { TagStoriesList } from '@/components/tag-stories-list';
import { StoryPermalinkView } from '@/components/story-permalink-view';

interface SlugPageProps {
  params: Promise<{
    username: string;
    slug: string;
  }>;
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { username, slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Find the profile user by username
  const profileUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!profileUser) {
    notFound();
  }

  // Get current user if authenticated
  let currentUser = null;
  if (user?.email) {
    currentUser = await prisma.user.findUnique({
      where: { email: user.email },
    });
  }

  // First, try to find a story with this shortId
  const story = await prisma.story.findFirst({
    where: {
      shortId: slug,
      author: {
        username,
      },
    },
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
      _count: {
        select: {
          reposts: true,
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
    },
  });

  // If we found a story, render the story page
  if (story) {
    const hasUpvoted = currentUser ? story.storyUpvotes.length > 0 : false;
    const hasBookmarked = currentUser ? story.bookmarks.length > 0 : false;

    // Transform the story data for the client component
    const transformedStory = {
      ...story,
      upvotes: Number(story.upvotes),
      repostCount: story._count?.reposts || 0,
      hasUpvoted,
      hasBookmarked,
      createdAt: story.createdAt.toISOString(),
      userTag: {
        ...story.userTag,
        credibilityScore: Number(story.userTag.credibilityScore),
        followerCount: Number(story.userTag.followerCount),
      },
      originalStory: story.originalStory
        ? {
            ...story.originalStory,
            upvotes: Number(story.originalStory.upvotes),
            createdAt: story.originalStory.createdAt.toISOString(),
            userTag: {
              ...story.originalStory.userTag,
              credibilityScore: Number(story.originalStory.userTag.credibilityScore),
              followerCount: Number(story.originalStory.userTag.followerCount),
            },
          }
        : null,
    };

    return (
      <LayoutWithSidebar user={profileUser}>
        <div className="container mx-auto max-w-2xl">
          <StoryPermalinkView story={transformedStory} currentUserId={currentUser?.id} />
        </div>
      </LayoutWithSidebar>
    );
  }

  // If no story found, treat it as a tag name
  // Parse tag and subtag from the slug
  const [tagName, subtag] = slug.split('.');

  // Find the user's tag
  const userTag = await prisma.userTag.findFirst({
    where: {
      userId: profileUser.id,
      tag: {
        name: tagName.toLowerCase(),
      },
    },
    include: {
      tag: true,
    },
  });

  if (!userTag) {
    notFound();
  }

  // Get stories for this tag (and optionally subtag)
  const stories = await prisma.story.findMany({
    where: {
      userTagId: userTag.id,
      ...(subtag && { subtag }),
    },
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
      storyUpvotes: currentUser
        ? {
            where: {
              userId: currentUser.id,
            },
          }
        : false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Transform stories for display
  const transformedStories = stories.map((story) => ({
    ...story,
    upvotes: Number(story.upvotes),
    hasUpvoted: currentUser ? story.storyUpvotes.length > 0 : false,
    createdAt: story.createdAt.toISOString(),
    userTag: {
      ...story.userTag,
      credibilityScore: Number(story.userTag.credibilityScore),
      followerCount: Number(story.userTag.followerCount),
    },
  }));

  const displayTitle = subtag ? `#${tagName}.${subtag}` : `#${tagName}`;

  return (
    <LayoutWithSidebar user={profileUser}>
      <div className="container mx-auto max-w-2xl space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold">
            {profileUser.displayName || profileUser.username} • {displayTitle}
          </h1>
          <p className="text-muted-foreground">
            {stories.length} {stories.length === 1 ? 'story' : 'stories'}
          </p>
        </div>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TagStoriesList initialStories={transformedStories as any} displayTitle={displayTitle} />
      </div>
    </LayoutWithSidebar>
  );
}
