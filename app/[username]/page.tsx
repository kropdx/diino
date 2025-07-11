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

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  website_url: string | null
  created_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (error || !data) {
        notFound()
      }

      setProfile(data)
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

  const isOwnProfile = user?.id === profile.id

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
                {isOwnProfile && (
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
              
              {profile.website_url && (
                <div>
                  <h3 className="font-semibold mb-2">Website</h3>
                  <a 
                    href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Globe className="h-4 w-4" />
                    {profile.website_url}
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

// Component to display user's tags as links
function UserTagLinks({ username }: { username: string }) {
  const [tags, setTags] = useState<string[]>([]);
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

        // Get user tags with canonical tag names
        const { data: userTags, error } = await supabase
          .from('UserTag')
          .select('tag_id')
          .eq('user_id', userData.user_id);

        if (!error && userTags) {
          // Get canonical tag names
          const tagIds = userTags.map(ut => ut.tag_id);
          const { data: canonicalTags } = await supabase
            .from('CanonicalTag')
            .select('name')
            .in('tag_id', tagIds);

          if (canonicalTags) {
            setTags(canonicalTags.map(t => t.name));
          }
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
      {tags.map((tagName) => (
        <Link
          key={tagName}
          href={`/${username}/${tagName}`}
          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
        >
          <Tag className="size-3" />
          #{tagName}
        </Link>
      ))}
    </div>
  );
}