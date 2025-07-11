import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;
  const supabase = await createClient();

  try {
    // Get current user (optional) to determine upvote status
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    let currentUserId: string | null = null;

    if (authUser?.email) {
      const { data: me } = await supabase
        .from('User')
        .select('user_id')
        .eq('email', authUser.email)
        .maybeSingle();
      currentUserId = me?.user_id || null;
    }

    // Fetch comments with author and upvote info
    const { data: comments, error } = await supabase
      .from('Comment')
      .select(
        `comment_id:comment_id, content, created_at, author_id, author:User!Comment_author_id_fkey(username, display_name), CommentUpvote(user_id)`
      )
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to client shape
    const mapped = (comments || []).map((c) => {
      const upvoteArray = (c as any).CommentUpvote as { user_id: string }[] | null;
      const upvotes = upvoteArray ? upvoteArray.length : 0;
      const hasUpvoted = !!upvoteArray?.some((u) => u.user_id === currentUserId);
      // We cannot check by email easily; will mark false for now
      return {
        comment_id: c.comment_id,
        content: c.content,
        created_at: c.created_at,
        upvotes,
        hasUpvoted,
        author: c.author,
      };
    });

    return NextResponse.json({ comments: mapped });
  } catch (err) {
    console.error('Error fetching comments:', err);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;
  const supabase = await createClient();

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 70) {
      return NextResponse.json({ error: 'Comment too long (70 chars max)' }, { status: 400 });
    }

    // Find DB user by email
    const { data: dbUser, error: userError } = await supabase
      .from('User')
      .select('user_id, username, display_name')
      .eq('email', authUser.email)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Insert comment
    const { data: inserted, error: insertErr } = await supabase
      .from('Comment')
      .insert({ story_id: storyId, author_id: dbUser.user_id, content: content.trim() })
      .select('comment_id, content, created_at')
      .single();

    if (insertErr) throw insertErr;

    const comment = {
      comment_id: inserted.comment_id,
      content: inserted.content,
      created_at: inserted.created_at,
      upvotes: 0,
      hasUpvoted: false,
      author: {
        username: dbUser.username,
        display_name: dbUser.display_name,
      },
    };

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error('Error posting comment:', err);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
} 