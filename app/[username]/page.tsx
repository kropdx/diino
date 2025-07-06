import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Globe } from 'lucide-react'

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to chat
          </Button>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {profile.display_name || profile.username}
            </CardTitle>
            <CardDescription>@{profile.username}</CardDescription>
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
  )
}