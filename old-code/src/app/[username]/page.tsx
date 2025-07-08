import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/components/user-profile';
import { LayoutWithSidebar } from '@/components/layout-with-sidebar';
import { UserTag, CanonicalTag } from '@prisma/client';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Find the profile user by username
  const profileUser = await prisma.user.findUnique({
    relationLoadStrategy: 'join',
    where: { username },
    include: {
      userTags: {
        where: {
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
      },
    },
  });

  if (!profileUser) {
    // Check if this might be a Clerk ID instead of username
    if (username.startsWith('user_')) {
      // Try to find by Clerk ID and redirect to their username
      const userByClerkId = await prisma.user.findUnique({
        where: { clerkId: username },
        select: { username: true },
      });

      if (userByClerkId && userByClerkId.username) {
        redirect(`/${userByClerkId.username}`);
      }
    }
    notFound();
  }

  // Check if viewing own profile
  const isOwnProfile = user?.email === profileUser.email;

  // If user found, get story counts and follow status for each tag
  let userTagsWithCounts: (UserTag & {
    tag: CanonicalTag;
    storyCount: number;
    isFollowing?: boolean;
  })[] = [];

  // Get current user for follow status if viewing someone else's profile
  const currentUserForFollows =
    !isOwnProfile && user?.email
      ? await prisma.user.findUnique({ where: { email: user.email } })
      : null;

  userTagsWithCounts = await Promise.all(
    profileUser.userTags.map(async (userTag) => {
      const [storyCount, followStatus] = await Promise.all([
        prisma.story.count({
          where: { userTagId: userTag.id },
        }),
        // Check if current user is following this tag (only if viewing another user's profile)
        currentUserForFollows
          ? prisma.userTagFollow.findUnique({
              where: {
                followerUserId_followedUserTagId: {
                  followerUserId: currentUserForFollows.id,
                  followedUserTagId: userTag.id,
                },
              },
            })
          : null,
      ]);

      return {
        ...userTag,
        storyCount,
        isFollowing: followStatus !== null,
      };
    })
  );

  // For authenticated users, show with sidebar
  if (user) {
    // Get the current user for the layout
    let currentUser;
    if (isOwnProfile) {
      currentUser = profileUser;
    } else {
      // Only fetch current user if viewing someone else's profile
      currentUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (!currentUser) {
        redirect('/sign-in');
      }
    }

    return (
      <LayoutWithSidebar user={currentUser}>
        <div className="container mx-auto p-6">
          <UserProfile
            user={profileUser}
            isOwnProfile={isOwnProfile}
            userTags={userTagsWithCounts}
          />
        </div>
      </LayoutWithSidebar>
    );
  }

  // For non-authenticated users, show without sidebar
  return (
    <div className="container mx-auto p-6">
      <UserProfile user={profileUser} isOwnProfile={false} userTags={userTagsWithCounts} />
    </div>
  );
}
