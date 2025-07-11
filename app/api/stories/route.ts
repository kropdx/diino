import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/stories - Fetch stories (for now just return empty array)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('User')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tagName = searchParams.get('tag');

    // Build query
    let query = supabase
      .from('Story')
      .select(`
        *,
        author:User!Story_author_id_fkey(username, display_name),
        user_tag:UserTag(
          *,
          tag:CanonicalTag(*)
        )
      `)
      .eq('author_id', profile.user_id)
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
        .eq('user_id', profile.user_id)
        .eq('tag.name', tagName);

      if (tagError || !userTags || userTags.length === 0) {
        return NextResponse.json([]);
      }

      query = query.eq('user_tag_id', userTags[0].user_tag_id);
    }

    const { data: stories, error: storiesError } = await query;

    if (storiesError) {
      console.error('Error fetching stories:', storiesError);
      return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
    }

    return NextResponse.json(stories || []);
  } catch (error) {
    console.error('Error in GET /api/stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/stories - Create a new story
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('User')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      content,
      userTagId,
      url,
      title,
      favicon,
      faviconBlobUrl,
      subtag,
      storyType = 'TEXT',
      originalStoryId,
      commentary,
    } = body;

    // Validate input
    if (storyType === 'REPOST') {
      if (!originalStoryId || !userTagId) {
        return NextResponse.json(
          { error: 'Original story and tag are required for reposts' },
          { status: 400 }
        );
      }
    } else if (!content?.trim() || !userTagId) {
      return NextResponse.json({ error: 'Content and tag are required' }, { status: 400 });
    }

    // Validate subtag format if provided
    if (subtag && !/^[a-zA-Z0-9_-]+$/.test(subtag)) {
      return NextResponse.json({ error: 'Invalid subtag format' }, { status: 400 });
    }

    // Verify user owns this tag
    const { data: userTag } = await supabase
      .from('UserTag')
      .select('*')
      .eq('user_tag_id', userTagId)
      .eq('user_id', profile.user_id)
      .single();

    if (!userTag) {
      return NextResponse.json({ error: 'Invalid tag selection' }, { status: 400 });
    }

    // Generate a short ID
    const shortId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

    // Create the story
    const { data: story, error: storyError } = await supabase
      .from('Story')
      .insert({
        short_id: shortId,
        author_id: profile.user_id,
        user_tag_id: userTagId,
        story_type: storyType,
        content: content || null,
        url: url || null,
        title: title || null,
        favicon: favicon || null,
        favicon_blob_url: faviconBlobUrl || null,
        subtag: subtag || null,
        original_story_id: originalStoryId || null,
        commentary: commentary || null,
      })
      .select(`
        *,
        author:User!Story_author_id_fkey(*),
        user_tag:UserTag(
          *,
          tag:CanonicalTag(*)
        )
      `)
      .single();

    if (storyError) {
      console.error('Error creating story:', storyError);
      // If shortId collision, try once more
      if (storyError.message.includes('duplicate key')) {
        const newShortId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
        const { data: retryStory, error: retryError } = await supabase
          .from('Story')
          .insert({
            short_id: newShortId,
            author_id: profile.user_id,
            user_tag_id: userTagId,
            story_type: storyType,
            content: content || null,
            url: url || null,
            title: title || null,
            favicon: favicon || null,
            favicon_blob_url: faviconBlobUrl || null,
            subtag: subtag || null,
            original_story_id: originalStoryId || null,
            commentary: commentary || null,
          })
          .select(`
            *,
            author:User!Story_author_id_fkey(*),
            user_tag:UserTag(
              *,
              tag:CanonicalTag(*)
            )
          `)
          .single();

        if (retryError) {
          return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
        }

        return NextResponse.json(retryStory);
      }
      return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
    }

    return NextResponse.json(story);
  } catch (error) {
    console.error('Error in POST /api/stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 