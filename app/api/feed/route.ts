import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get all the users that the current user follows
    const { data: followedUsers } = await supabase
      .from('Follow')
      .select('channel_id')
      .eq('follower_user_id', profile.user_id)
      .eq('channel_type', 'USER_ALL');

    const followedUserIds = followedUsers?.map(f => f.channel_id) || [];

    // Get all the user tags that the current user follows
    const { data: followedTags } = await supabase
      .from('Follow')
      .select('channel_id')
      .eq('follower_user_id', profile.user_id)
      .eq('channel_type', 'USER_TAG');

    const followedUserTagIds = followedTags?.map(f => f.channel_id) || [];

    // Build the query for stories
    let query = supabase
      .from('Story')
      .select(`
        *,
        author:User!Story_author_id_fkey(
          user_id,
          username,
          display_name
        ),
        user_tag:UserTag(
          user_tag_id,
          tag_id,
          tag:CanonicalTag(
            tag_id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    // Include stories from:
    // 1. The current user (their own posts)
    // 2. Users they follow
    // 3. UserTags they follow
    const conditions = [`author_id.eq.${profile.user_id}`];
    
    if (followedUserIds.length > 0) {
      conditions.push(`author_id.in.(${followedUserIds.join(',')})`);
    }
    
    if (followedUserTagIds.length > 0) {
      conditions.push(`user_tag_id.in.(${followedUserTagIds.join(',')})`);
    }

    // Apply OR conditions
    query = query.or(conditions.join(','));

    const { data: stories, error: storiesError } = await query;

    if (storiesError) {
      console.error('Error fetching feed stories:', storiesError);
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
    }

    // Transform the data to match StoryCard's expected format
    const transformedStories = (stories || []).map(story => ({
      id: story.story_id,
      shortId: story.short_id,
      content: story.content,
      url: story.url,
      title: story.title,
      favicon: story.favicon,
      faviconBlobUrl: story.favicon_blob_url,
      subtag: story.subtag,
      storyType: story.story_type,
      createdAt: story.created_at,
      upvotes: story.upvotes || 0,
      hasUpvoted: false, // TODO: Check if user has upvoted
      hasBookmarked: false, // TODO: Check if user has bookmarked
      author: {
        id: story.author.user_id,
        username: story.author.username,
        displayName: story.author.display_name
      },
      userTag: story.user_tag ? {
        tag: {
          name: story.user_tag.tag?.name || 'uncategorized'
        }
      } : {
        tag: {
          name: 'uncategorized'
        }
      }
    }));

    return NextResponse.json(transformedStories);
  } catch (error) {
    console.error('Error in GET /api/feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}