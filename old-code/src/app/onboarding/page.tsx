'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{
    id: string;
    email?: string | null;
    user_metadata?: {
      first_name?: string;
      onboarded?: boolean;
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [url, setUrl] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>(
    'idle'
  );
  const checkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, [supabase]);

  // Load existing user data if they're already onboarded
  useEffect(() => {
    async function loadUserData() {
      if (!user) return;

      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.onboarded) {
            setIsEditMode(true);
            setUsername(userData.username || '');
            setOriginalUsername(userData.username || '');
            setDisplayName(userData.displayName || '');
            setBio(userData.bio || '');
            setUrl(userData.url || '');
            setUsernameStatus('idle');
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadUserData();
  }, [user]);

  // Check username availability with debouncing
  useEffect(() => {
    if (checkingTimeoutRef.current) {
      clearTimeout(checkingTimeoutRef.current);
    }

    // Skip check if username hasn't changed in edit mode
    if (isEditMode && username === originalUsername) {
      setUsernameStatus('idle');
      return;
    }

    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/check-username?username=${encodeURIComponent(username)}`
        );
        const data = await response.json();
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameStatus('idle');
      }
    }, 500);

    checkingTimeoutRef.current = timeout;

    return () => {
      if (checkingTimeoutRef.current) {
        clearTimeout(checkingTimeoutRef.current);
      }
    };
  }, [username, originalUsername, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || username.length < 3) {
      return;
    }

    // In edit mode, skip availability check if username hasn't changed
    if (!isEditMode && usernameStatus !== 'available') {
      return;
    }

    if (isEditMode && username !== originalUsername && usernameStatus === 'taken') {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          displayName: displayName || undefined,
          bio: bio || undefined,
          url: url || undefined,
        }),
      });

      if (response.ok) {
        // Update user metadata to mark as onboarded
        await supabase.auth.updateUser({
          data: { onboarded: true },
        });
        router.push('/home');
      } else {
        const error = await response.json();
        console.error('Error:', error);
        alert(error.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error during save:', error);
      alert('An error occurred while saving');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUsername = username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);

  if (isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Profile' : 'Welcome to diino!'}</CardTitle>
          <CardDescription>
            {isEditMode
              ? 'Update your profile information below.'
              : "Let's set up your profile. Choose a username to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="johndoe"
                  className={
                    usernameStatus === 'taken'
                      ? 'border-red-500 pr-10'
                      : usernameStatus === 'available'
                        ? 'border-green-500 pr-10'
                        : 'pr-10'
                  }
                  disabled={isLoading}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {usernameStatus === 'available' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {usernameStatus === 'taken' && <AlertCircle className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              {username && !isValidUsername && (
                <p className="text-sm text-red-500">
                  Username can only contain letters, numbers, underscores, and hyphens
                </p>
              )}
              {usernameStatus === 'taken' && (
                <p className="text-sm text-red-500">This username is already taken</p>
              )}
              {usernameStatus === 'available' && (
                <p className="text-sm text-green-500">Username is available!</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This is how your name will appear on your profile
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a bit about yourself..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Website</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading ||
                !username ||
                !isValidUsername ||
                (usernameStatus === 'taken' && username !== originalUsername) ||
                (!isEditMode && usernameStatus !== 'available')
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditMode ? (
                'Update Profile'
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
