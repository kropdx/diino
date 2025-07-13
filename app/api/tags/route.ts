import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/tags - Get all tags for the current user
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching profile for auth user:', user.id);
    
    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('User')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ 
        error: 'User profile not found', 
        details: profileError.message,
        hint: profileError.hint
      }, { status: 404 });
    }

    if (!profile) {
      console.error('No profile found for user:', user.id);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    console.log('Found profile:', profile);

    // Get user's tags with canonical tag info and story count
    const { data: userTags, error: tagsError } = await supabase
      .from('UserTag')
      .select(`
        *,
        tag:CanonicalTag(*)
      `)
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false });

    if (tagsError) {
      console.error('Error fetching tags:', tagsError);
      return NextResponse.json({ 
        error: 'Failed to fetch tags',
        details: tagsError.message,
        hint: tagsError.hint
      }, { status: 500 });
    }

    // Get story counts and subtags for each tag
    const tagsWithCounts = await Promise.all(
      (userTags || []).map(async (userTag) => {
        const { count } = await supabase
          .from('Story')
          .select('*', { count: 'exact', head: true })
          .eq('user_tag_id', userTag.user_tag_id);

        // Get unique subtags for this user tag
        const { data: subtags } = await supabase
          .from('Story')
          .select('subtag')
          .eq('user_tag_id', userTag.user_tag_id)
          .not('subtag', 'is', null)
          .order('subtag');

        // Get unique subtags
        const uniqueSubtags = [...new Set(subtags?.map(s => s.subtag) || [])];

        return {
          ...userTag,
          story_count: count || 0,
          subtags: uniqueSubtags
        };
      })
    );

    return NextResponse.json(tagsWithCounts);
  } catch (error) {
    console.error('Error in GET /api/tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tags - Create a new tag for the current user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { tagName } = body;

    if (!tagName || typeof tagName !== 'string') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    // Normalize tag name (lowercase, trim, remove leading #)
    const normalizedTagName = tagName.trim().toLowerCase().replace(/^#/, '');

    if (normalizedTagName.length === 0) {
      return NextResponse.json({ error: 'Tag name cannot be empty' }, { status: 400 });
    }

    // Validate tag name format (alphanumeric, underscores, and hyphens only)
    if (!/^[a-zA-Z0-9_-]+$/.test(normalizedTagName)) {
      return NextResponse.json({ error: 'Tag names can only contain letters, numbers, underscores, and hyphens' }, { status: 400 });
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

    // Check if canonical tag exists
    let { data: canonicalTag } = await supabase
      .from('CanonicalTag')
      .select('*')
      .eq('name', normalizedTagName)
      .single();

    // If canonical tag doesn't exist, create it
    if (!canonicalTag) {
      const { data: newCanonicalTag, error: createError } = await supabase
        .from('CanonicalTag')
        .insert({ name: normalizedTagName })
        .select()
        .single();

      if (createError) {
        console.error('Error creating canonical tag:', createError);
        return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
      }

      canonicalTag = newCanonicalTag;
    }

    // Check if user already has this tag
    const { data: existingUserTag } = await supabase
      .from('UserTag')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('tag_id', canonicalTag.tag_id)
      .single();

    if (existingUserTag) {
      return NextResponse.json({ error: 'You already have this tag' }, { status: 409 });
    }

    // Create user tag
    const { data: userTag, error: userTagError } = await supabase
      .from('UserTag')
      .insert({
        user_id: profile.user_id,
        tag_id: canonicalTag.tag_id,
      })
      .select(`
        *,
        tag:CanonicalTag(*)
      `)
      .single();

    if (userTagError) {
      console.error('Error creating user tag:', userTagError);
      return NextResponse.json({ error: 'Failed to create user tag' }, { status: 500 });
    }

    // Return with story count (0 for new tags)
    const result = {
      ...userTag,
      story_count: 0
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 