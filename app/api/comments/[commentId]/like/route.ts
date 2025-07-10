import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  const supabase = await createClient();

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: dbUser, error: userError } = await supabase
      .from('User')
      .select('user_id')
      .eq('email', authUser.email)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine if upvote exists
    const { data: existing, error: existingErr } = await supabase
      .from('CommentUpvote')
      .select('user_id')
      .eq('comment_id', commentId)
      .eq('user_id', dbUser.user_id)
      .maybeSingle();

    if (existingErr) throw existingErr;

    let liked = false;

    if (existing) {
      // Remove upvote
      const { error: delErr } = await supabase
        .from('CommentUpvote')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', dbUser.user_id);
      if (delErr) throw delErr;
    } else {
      liked = true;
      const { error: insErr } = await supabase
        .from('CommentUpvote')
        .insert({ comment_id: commentId, user_id: dbUser.user_id });
      if (insErr) throw insErr;
    }

    // Count upvotes
    const { count } = await supabase
      .from('CommentUpvote')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    return NextResponse.json({ liked, upvotes: count || 0 });
  } catch (err) {
    console.error('Error toggling comment like:', err);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
} 