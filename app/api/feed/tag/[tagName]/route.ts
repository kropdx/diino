import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tagName: string }> }
) {
  try {
    const supabase = await createClient();
    const { tagName } = await params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('User')
      .select('user_id')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get the canonical tag ID
    const { data: canonicalTag, error: tagError } = await supabase
      .from('CanonicalTag')
      .select('tag_id')
      .eq('name', tagName)
      .single();

    if (tagError || !canonicalTag) {
      return NextResponse.json([]);
    }

    // TODO: For now, we'll return stories from all users with this tag
    // In the future, we'll implement a following system and filter by followed users
    const { data: stories, error: storiesError } = await supabase
      .from('Story')
      .select(`
        *,
        author:User!Story_author_id_fkey(username, display_name),
        user_tag:UserTag!inner(
          *,
          tag:CanonicalTag!inner(*)
        )
      `)
      .eq('user_tag.tag.tag_id', canonicalTag.tag_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (storiesError) {
      console.error('Error fetching tag feed:', storiesError);
      return NextResponse.json({ error: 'Failed to fetch tag feed' }, { status: 500 });
    }

    return NextResponse.json(stories || []);
  } catch (error) {
    console.error('Error in GET /api/feed/tag/[tagName]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 