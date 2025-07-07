import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Globe, LogOut } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Fetch user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !profile) {
    notFound()
  }

  // Check if this is the current user's profile
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  return (
    <AppLayout>
      <div className="flex items-center justify-center p-4 h-full">
        <div className="w-full max-w-2xl">
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
        </div>
      </div>
    </AppLayout>
  )
}