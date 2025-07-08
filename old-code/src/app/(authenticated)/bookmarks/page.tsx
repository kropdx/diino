'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StoryCard } from '@/components/story-card';
import { Bookmark } from 'lucide-react';

interface Story {
  id: string;
  shortId: string;
  content: string | null;
  url: string | null;
  title: string | null;
  favicon: string | null;
  faviconBlobUrl?: string | null;
  faviconImgixUrl?: string | null;
  subtag: string | null;
  storyType: string;
  createdAt: string;
  upvotes: number;
  repostCount?: number;
  hasUpvoted?: boolean;
  hasBookmarked?: boolean;
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

export default function BookmarksPage() {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    async function loadBookmarks() {
      if (!user) return;

      try {
        const response = await fetch('/api/bookmarks');
        if (response.ok) {
          const data = await response.json();
          // All bookmarked stories have hasBookmarked: true
          const bookmarkedStories = data.stories.map((story: Story) => ({
            ...story,
            hasBookmarked: true,
          }));
          setStories(bookmarkedStories);
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBookmarks();
  }, [user]);

  const handleUpvote = async (storyId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const { liked, upvotes } = await response.json();
        setStories(
          stories.map((story) =>
            story.id === storyId ? { ...story, hasUpvoted: liked, upvotes } : story
          )
        );
      }
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const handleBookmark = async (storyId: string) => {
    try {
      // Remove bookmark
      const response = await fetch(`/api/bookmarks?storyId=${storyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the story from the list
        setStories(stories.filter((story) => story.id !== storyId));
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  return (
    <main className="container mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Bookmark className="w-5 h-5" />
        <h1 className="text-2xl font-bold">Bookmarks</h1>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          // Show skeleton loaders while loading
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : stories.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No bookmarked stories yet. Start saving stories for later!
            </CardContent>
          </Card>
        ) : (
          stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onUpvote={handleUpvote}
              isUpvoting={false}
              onBookmark={handleBookmark}
              isBookmarking={false}
            />
          ))
        )}
      </div>
    </main>
  );
}
