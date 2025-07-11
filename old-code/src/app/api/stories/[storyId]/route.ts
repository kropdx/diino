import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

// Helper function to move a single story to user's trash tag
async function moveStoryToTrash(userId: string, storyId: string) {
  // Get the current story to preserve original tag info
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      userTag: {
        include: { tag: true },
      },
    },
  });

  if (!story) {
    throw new Error('Story not found');
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

  // Move the story to trash, preserving original tag info for restoration
  await prisma.story.update({
    where: { id: storyId },
    data: {
      userTagId: trashUserTag.id,
      originalUserTagId: story.userTag?.tagId || null, // Store original CanonicalTag ID
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
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

    const { storyId } = await params;

    // Find the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the story and verify ownership
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: true,
      },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if the current user is the author of the story
    if (story.author.id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own stories' },
        { status: 403 }
      );
    }

    // Move the story to user's trash tag (soft delete)
    await moveStoryToTrash(currentUser.id, storyId);

    return NextResponse.json({ message: 'Story moved to trash successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
