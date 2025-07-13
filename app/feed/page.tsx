'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StoryCard } from '@/components/story-card';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function FeedPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    fetchFeed();
  }, [user]);

  const fetchFeed = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/feed');
      
      if (!response.ok) {
        throw new Error('Failed to load feed');
      }

      const data = await response.json();
      setStories(data);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async (storyId: string) => {
    // TODO: Implement upvote functionality
    console.log('Upvote story:', storyId);
  };

  const handleBookmark = async (storyId: string) => {
    // TODO: Implement bookmark functionality
    console.log('Bookmark story:', storyId);
  };

  const handleRepost = async (story: any) => {
    // TODO: Implement repost functionality
    console.log('Repost story:', story);
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="p-6">
            <p>Please log in to view your feed.</p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-semibold">Your Feed</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Posts from people and tags you follow
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Card className="p-6 text-center">
                <p className="text-destructive">{error}</p>
              </Card>
            ) : stories.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  No posts in your feed yet. Follow some users or tags to see their posts here!
                </p>
              </Card>
            ) : (
              stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onUpvote={handleUpvote}
                  onBookmark={handleBookmark}
                  onRepost={handleRepost}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}