'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function OnboardingPage() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  
  const router = useRouter()
  // Using the shared Supabase client instance
  const { user } = useAuth()

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    try {
      const { data, error } = await supabase
        .from('User')
        .select('username')
        .eq('username', usernameToCheck)
        .single()

      if (error && error.code === 'PGRST116') {
        // No rows returned means username is available
        setUsernameAvailable(true)
      } else if (data) {
        setUsernameAvailable(false)
      }
    } catch (err) {
      console.error('Error checking username:', err)
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Check if user is available from hook
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Validate username
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long')
      }

      if (!usernameAvailable) {
        throw new Error('Username is not available')
      }

      // Update the User table with the profile information
      const { error: updateError } = await supabase
        .from('User')
        .update({
          username: username.toLowerCase(),
          display_name: displayName || username,
          bio,
          url: websiteUrl,
          onboarded: true
        })
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      // Force refresh the auth state
      window.location.href = '/home'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Diino!</CardTitle>
          <CardDescription>
            Let&apos;s set up your profile to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                  setUsername(value)
                  checkUsernameAvailability(value)
                }}
                placeholder="johndoe"
                required
                minLength={3}
                maxLength={30}
              />
              {checkingUsername && (
                <p className="text-sm text-muted-foreground">Checking availability...</p>
              )}
              {!checkingUsername && usernameAvailable === true && username.length >= 3 && (
                <p className="text-sm text-green-600">Username is available!</p>
              )}
              {!checkingUsername && usernameAvailable === false && (
                <p className="text-sm text-red-600">Username is already taken</p>
              )}
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscores only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website</Label>
              <Input
                id="websiteUrl"
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !username || !usernameAvailable}
            >
              {loading ? 'Creating Profile...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}