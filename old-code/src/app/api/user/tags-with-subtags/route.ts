import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

// GET /api/user/tags-with-subtags - Get user's tags with their used subtags
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

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's tags with their stories and subtags (excluding trash tags)
    const userTags = await prisma.userTag.findMany({
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
        Story: {
          select: {
            subtag: true,
          },
          where: {
            subtag: {
              not: null,
            },
          },
        },
      },
      orderBy: {
        tag: {
          name: 'asc',
        },
      },
    });

    // Process tags to group subtags
    const tagsWithSubtags = userTags.map(
      (userTag: { id: string; tag: { name: string }; Story: { subtag: string | null }[] }) => {
        // Get unique subtags for this tag
        const subtags = [
          ...new Set(
            userTag.Story.map((story: { subtag: string | null }) => story.subtag).filter(
              (subtag: string | null): subtag is string => subtag !== null
            )
          ),
        ].sort();

        return {
          id: userTag.id,
          tagName: userTag.tag.name,
          subtags,
        };
      }
    );

    return NextResponse.json(tagsWithSubtags);
  } catch (error) {
    console.error('Error fetching tags with subtags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags with subtags' }, { status: 500 });
  }
}
