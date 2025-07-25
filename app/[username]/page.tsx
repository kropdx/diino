'use client'

import { useParams, notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Globe, LogOut, Tag } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { TagManager } from '@/components/TagManager'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { StoryCard } from '@/components/story-card'
import { FollowTagsDialog } from '@/components/FollowTagsDialog'
import { Database } from '@/lib/supabase/types'

type UserTag = Database['public']['Tables']['UserTag']['Row'] & {
  tag: Database['public']['Tables']['CanonicalTag']['Row']
}

interface Profile {
  user_id: string
  username: string
  display_name: string | null
  bio: string | null
  url: string | null
  created_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userTags, setUserTags] = useState<UserTag[]>([])
  
  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('username', username)
        .single()

      if (error || !data) {
        notFound()
      }

      setProfile(data)
      
      // Fetch user tags
      const { data: tags } = await supabase
        .from('UserTag')
        .select(`
          *,
          tag:CanonicalTag(*)
        `)
        .eq('user_id', data.user_id)
        
      if (tags) {
        setUserTags(tags as UserTag[])
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      notFound()
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-4 h-full">
          <Card className="p-6">
            <p>Loading profile...</p>
          </Card>
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    notFound()
  }

  const isOwnProfile = user?.id === profile.user_id

  return (
    <AppLayout>
      <div className="flex flex-col p-4 h-full overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* Profile Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {profile.display_name || profile.username}
                  </CardTitle>
                  <CardDescription>@{profile.username}</CardDescription>
                </div>
                {isOwnProfile ? (
                  <div className="flex gap-2">
                    <Link href="/settings">
                      <Button variant="outline">Edit Profile</Button>
                    </Link>
                    <Link href="/logout">
                      <Button variant="outline">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <FollowTagsDialog 
                    targetUserId={profile.user_id}
                    userTags={userTags}
                    triggerButton={<Button variant="outline">Follow Tags</Button>}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
              
              {profile.url && (
                <div>
                  <h3 className="font-semibold mb-2">Website</h3>
                  <a 
                    href={profile.url.startsWith('http') ? profile.url : `https://${profile.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Globe className="h-4 w-4" />
                    {profile.url}
                  </a>
                </div>
              )}
              
              <div className="pt-4 text-sm text-muted-foreground">
                Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </CardContent>
          </Card>

          {/* User's Tags Section */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Browse posts by tag</CardDescription>
            </CardHeader>
            <CardContent>
              {isOwnProfile ? (
                <>
                  <TagManager />
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">View your posts by tag:</p>
                    <UserTagLinks username={username} />
                  </div>
                </>
              ) : (
                <UserTagLinks username={username} />
              )}
            </CardContent>
          </Card>

          {/* User's Posts Section */}
          <Card>
            <CardHeader>
              <CardTitle>All Posts</CardTitle>
              <CardDescription>Everything posted by @{username}</CardDescription>
            </CardHeader>
            <CardContent>
              <UserPosts username={username} />
            </CardContent>
          </Card>

          {/* Create Post Button - Only show for own profile */}
          {isOwnProfile && (
            <div className="flex justify-center pt-4">
              <Link href="/post">
                <Button size="lg">
                  Create a Post
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

// Component to display user's posts
interface UserStory {
  story_id: string;
  short_id: string;
  content: string | null;
  url: string | null;
  title: string | null;
  favicon: string | null;
  favicon_blob_url: string | null;
  subtag: string | null;
  story_type: string;
  created_at: string;
  upvotes: number;
  author_id: string;
  author?: {
    username: string;
    display_name: string | null;
  };
  user_tag?: {
    user_tag_id: string;
    tag_id: string;
    tag?: {
      tag_id: string;
      name: string;
    };
  };
}

interface TransformedStory {
  id: string;
  shortId: string;
  content: string | null;
  url: string | null;
  title: string | null;
  favicon: string | null;
  faviconBlobUrl: string | null;
  subtag: string | null;
  storyType: string;
  createdAt: string;
  upvotes: number;
  hasUpvoted: boolean;
  hasBookmarked: boolean;
  author: {
    id: string;
    username: string;
    displayName: string | null;
  };
  userTag: {
    tag: {
      name: string;
    };
  };
}

function UserPosts({ username }: { username: string }) {
  const [stories, setStories] = useState<TransformedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStories = async () => {
      try {
        const response = await fetch(`/api/users/${username}/stories`);
        
        if (!response.ok) {
          throw new Error('Failed to load posts');
        }

        const data = await response.json();
        
        // Debug: Log the first story to see the structure
        if (data.length > 0) {
          console.log('First story data:', JSON.stringify(data[0], null, 2));
        }
        
        // Transform the data to match StoryCard's expected format
        const transformedStories = data.map((story: UserStory) => ({
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
          hasUpvoted: false,
          hasBookmarked: false,
          author: {
            id: story.author_id,
            username: story.author?.username || username,
            displayName: story.author?.display_name || null
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
        
        setStories(transformedStories);
      } catch (err) {
        console.error('Error fetching user stories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStories();
  }, [username]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  if (stories.length === 0) {
    return <div className="text-sm text-muted-foreground">No posts yet.</div>;
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          onUpvote={() => {}}
          onBookmark={() => {}}
        />
      ))}
    </div>
  );
}

// Component to display user's tags as links
function UserTagLinks({ username }: { username: string }) {
  const [tags, setTags] = useState<{ name: string; user_tag_id: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserTags = async () => {
      try {
        // First get the user
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('user_id')
          .eq('username', username)
          .single();

        if (userError || !userData) {
          return;
        }

        // Get user tags with tag names
        const { data: userTags, error } = await supabase
          .from('UserTag')
          .select(`
            user_tag_id,
            tag:CanonicalTag(name)
          `)
          .eq('user_id', userData.user_id);

        if (!error && userTags) {
          const rawUserTags = userTags as any[];
          const tagData = rawUserTags
            .filter((ut) => ut.tag && typeof ut.tag === 'object' && 'name' in ut.tag)
            .map((ut) => ({
              name: ut.tag.name as string,
              user_tag_id: ut.user_tag_id as string,
            }));
          setTags(tagData);
        }
      } catch (error) {
        console.error('Error fetching user tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTags();
  }, [username]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading tags...</div>;
  }

  if (tags.length === 0) {
    return <div className="text-sm text-muted-foreground">No tags yet.</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.user_tag_id}
          href={`/${username}/${tag.name}`}
          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
        >
          <Tag className="size-3" />
          #{tag.name}
        </Link>
      ))}
    </div>
  );
}