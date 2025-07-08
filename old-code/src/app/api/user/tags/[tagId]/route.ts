import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

// Note: Edge Runtime requires special setup with Prisma (Accelerate or adapters)
// For now, we'll use Node.js runtime which is still fast in production
// export const runtime = 'edge';

// Removed unused getUserByEmail function

// Helper function to move stories to user's trash tag
async function moveStoriesToTrash(userId: string, userTagId: string) {
  // First, get the original UserTag to extract the CanonicalTag ID
  const originalUserTag = await prisma.userTag.findUnique({
    where: { id: userTagId },
    include: { tag: true },
  });

  if (!originalUserTag) {
    throw new Error('Original UserTag not found');
  }

  // Create trash tag name for this user
  const trashTagName = `trash_${userId}`;

  // Find or create the user's trash tag
  let trashCanonicalTag = await prisma.canonicalTag.findUnique({
    where: { name: trashTagName },
  });

  if (!trashCanonicalTag) {
    // Create the canonical trash tag
    trashCanonicalTag = await prisma.canonicalTag.create({
      data: { name: trashTagName },
    });
  }

  // Find or create the user's trash UserTag
  let trashUserTag = await prisma.userTag.findFirst({
    where: {
      userId: userId,
      tagId: trashCanonicalTag.id,
    },
  });

  if (!trashUserTag) {
    // Create the UserTag for trash
    trashUserTag = await prisma.userTag.create({
      data: {
        userId: userId,
        tagId: trashCanonicalTag.id,
      },
    });
  }

  // Move all stories from the deleted tag to trash
  // Store the CanonicalTag ID in originalUserTagId for restoration
  await prisma.story.updateMany({
    where: { userTagId: userTagId },
    data: {
      userTagId: trashUserTag.id,
      originalUserTagId: originalUserTag.tagId, // Store CanonicalTag ID for restoration
    },
  });
}

// DELETE /api/user/tags/[tagId] - Delete a tag for the current user
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ tagId: string }> }
) {
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

    // Await params as required in Next.js 15
    const params = await context.params;
    const userTagId = params.tagId;

    console.log('[DELETE] Attempting to delete tag:', userTagId);

    if (!userTagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
    });

    if (!user) {
      console.log('[DELETE] User not found for email:', authUser.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[DELETE] Found user:', user.id, 'searching for tag:', userTagId);

    // Check if the user tag exists and belongs to the current user
    const userTag = await prisma.userTag.findFirst({
      where: {
        id: userTagId,
        userId: user.id,
      },
    });

    if (!userTag) {
      console.log('[DELETE] Tag not found. UserTagId:', userTagId, 'UserId:', user.id);

      // Let's check if the tag exists at all
      const anyTag = await prisma.userTag.findUnique({
        where: { id: userTagId },
      });

      if (anyTag) {
        console.log('[DELETE] Tag exists but belongs to different user:', anyTag.userId);
      } else {
        console.log('[DELETE] Tag does not exist in database');
      }

      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Check if there are any stories using this tag
    const storyCount = await prisma.story.count({
      where: { userTagId: userTagId },
    });

    console.log('[DELETE] Tag has', storyCount, 'stories');

    if (storyCount > 0) {
      // Move stories to trash instead of preventing deletion
      await moveStoriesToTrash(user.id, userTagId);
      console.log('[DELETE] Moved', storyCount, 'stories to trash');
    }

    console.log('[DELETE] Deleting tag:', userTagId);

    // Delete the user tag (stories are now safely in trash)
    await prisma.userTag.delete({
      where: { id: userTagId },
    });

    console.log('[DELETE] Tag deleted successfully');

    const message =
      storyCount > 0
        ? `Tag deleted successfully. ${storyCount} story${storyCount === 1 ? '' : 's'} moved to trash.`
        : 'Tag deleted successfully.';

    return NextResponse.json({
      message,
      storiesMovedToTrash: storyCount,
    });
  } catch (error) {
    console.error('Error deleting user tag:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete tag',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
