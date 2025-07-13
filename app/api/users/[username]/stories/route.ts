import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient();
    const { username } = await params;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tagName = searchParams.get('tag');
    const subtag = searchParams.get('subtag');
    
    // Get the user by username
    const { data: targetUser, error: userError } = await supabase
      .from('User')
      .select('user_id')
      .eq('username', username)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query - being explicit about fields and relationships
    let query = supabase
      .from('Story')
      .select(`
        *,
        author:User!Story_author_id_fkey(username, display_name),
        user_tag:UserTag(
          user_tag_id,
          tag_id,
          tag:CanonicalTag(
            tag_id,
            name
          )
        )
      `)
      .eq('author_id', targetUser.user_id)
      .order('created_at', { ascending: false });

    // Filter by tag if provided
    if (tagName) {
      // First get the user's tag with this name
      const { data: userTags, error: tagError } = await supabase
        .from('UserTag')
        .select(`
          user_tag_id,
          tag:CanonicalTag!inner(
            name
          )
        `)
        .eq('user_id', targetUser.user_id)
        .eq('tag.name', tagName);

      if (tagError || !userTags || userTags.length === 0) {
        return NextResponse.json([]);
      }

      query = query.eq('user_tag_id', userTags[0].user_tag_id);

      if (subtag) {
        query = query.eq('subtag', subtag);
      }
    }

    const { data: stories, error: storiesError } = await query;

    if (storiesError) {
      console.error('Error fetching user stories:', storiesError);
      return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
    }

    return NextResponse.json(stories || []);
  } catch (error) {
    console.error('Error in GET /api/users/[username]/stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 