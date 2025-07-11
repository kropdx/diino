'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StoryCard } from '@/components/story-card';
import NaviBar from '@/components/navi-bar';
import { RepostModal } from '@/components/repost-modal';

interface UserTag {
  id: string;
  tag: {
    id: string;
    name: string;
  };
}

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
  commentary?: string | null;
  originalStory?: Story | null;
  author: {
    id: string;
    username: string | null;
    displayName: string | null;
  };
  userTag: {
    tag: {
      name: string;
    };
  };
}

// Type for API response that might have different structure
interface ApiStory extends Omit<Story, 'author' | 'userTag'> {
  author?: Story['author'];
  user?: Story['author'];
  userTag?: Story['userTag'];
  tag?: Story['userTag']['tag'];
}

export default function HomePage() {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [currentDbUser, setCurrentDbUser] = useState<{
    id: string;
    username: string | null;
  } | null>(null);
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const [storyToRepost, setStoryToRepost] = useState<Story | null>(null);
  const [isReposting, setIsReposting] = useState(false);

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

  // Load user data and tags
  useEffect(() => {
    async function loadUserData() {
      if (!user) return;

      try {
        // Load user, tags and stories in parallel
        const [userResponse, tagsResponse, storiesResponse] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/user/tags'),
          fetch('/api/stories'),
        ]);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentDbUser(userData);
        }

        if (tagsResponse.ok) {
          const tags = await tagsResponse.json();
          setUserTags(tags);
        }

        if (storiesResponse.ok) {
          const storiesData = await storiesResponse.json();
          // Transform the data to match our interface
          const transformedStories = storiesData.map((story: ApiStory) => ({
            ...story,
            author: story.author || story.user!,
            userTag: story.userTag || { tag: story.tag! },
          }));
          setStories(transformedStories);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoadingTags(false);
        setIsLoadingStories(false);
      }
    }

    loadUserData();
  }, [user]);

  const handleUpvote = async (storyId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const { liked, upvotes } = await response.json();
        // Update the story in the local state
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

  const handlePost = async (
    content: string,
    userTagId: string,
    urlInfo?: {
      url: string;
      title: string;
      favicon: string | null;
      faviconBlobUrl?: string | null;
    },
    subtag?: string
  ) => {
    setIsPosting(true);
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          userTagId,
          subtag,
          ...(urlInfo && {
            url: urlInfo.url,
            title: urlInfo.title,
            favicon: urlInfo.favicon,
            faviconBlobUrl: urlInfo.faviconBlobUrl,
          }),
        }),
      });

      if (response.ok) {
        const newStory = await response.json();
        // Transform the response to match our interface
        const transformedStory = {
          ...newStory,
          author: newStory.author || newStory.user,
          userTag: newStory.userTag || { tag: newStory.tag },
        };
        setStories([transformedStory, ...stories]);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to post story');
      }
    } catch (error) {
      console.error('Error posting story:', error);
      alert('An error occurred while posting');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the story from the local state
        setStories(stories.filter((story) => story.id !== storyId));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete story');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('An error occurred while deleting the story');
    }
  };

  const handleBookmark = async (storyId: string) => {
    try {
      const story = stories.find((s) => s.id === storyId);
      if (!story) return;

      if (story.hasBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?storyId=${storyId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setStories(stories.map((s) => (s.id === storyId ? { ...s, hasBookmarked: false } : s)));
        }
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId }),
        });

        if (response.ok) {
          setStories(stories.map((s) => (s.id === storyId ? { ...s, hasBookmarked: true } : s)));
        }
      }
    } catch (error) {
      console.error('Error bookmarking story:', error);
    }
  };

  const handleRepostClick = (story: Story) => {
    setStoryToRepost(story);
    setRepostModalOpen(true);
  };

  const handleRepost = async (commentary: string, userTagId: string, subtag?: string) => {
    if (!storyToRepost) return;

    setIsReposting(true);
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyType: 'REPOST',
          originalStoryId: storyToRepost.id,
          commentary: commentary.trim() || null,
          userTagId,
          subtag: subtag || null,
        }),
      });

      if (response.ok) {
        const newStory = await response.json();
        // Transform the response to match our interface
        const transformedStory = {
          ...newStory,
          author: newStory.author || newStory.user,
          userTag: newStory.userTag || { tag: newStory.tag },
        };
        setStories([transformedStory, ...stories]);
        setRepostModalOpen(false);
        setStoryToRepost(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to repost story');
      }
    } catch (error) {
      console.error('Error reposting story:', error);
      alert('An error occurred while reposting');
    } finally {
      setIsReposting(false);
    }
  };

  return (
    <main className="container mx-auto max-w-2xl p-6 space-y-6">
      {/* NaviBar for story creation */}
      {isLoadingTags ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ) : userTags.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Add some tags in your profile to start posting stories
          </CardContent>
        </Card>
      ) : (
        <NaviBar onSubmit={handlePost} userTags={userTags} isPosting={isPosting} />
      )}

      {/* Stories Feed */}
      <div className="space-y-4">
        {isLoadingStories ? (
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
              No stories yet. Be the first to share!
            </CardContent>
          </Card>
        ) : (
          stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onUpvote={handleUpvote}
              isUpvoting={false}
              onDelete={
                currentDbUser && story.author.id === currentDbUser.id ? handleDelete : undefined
              }
              onBookmark={handleBookmark}
              isBookmarking={false}
              onRepost={handleRepostClick}
            />
          ))
        )}
      </div>

      {/* Repost Modal */}
      {storyToRepost && (
        <RepostModal
          isOpen={repostModalOpen}
          onClose={() => {
            setRepostModalOpen(false);
            setStoryToRepost(null);
          }}
          story={storyToRepost}
          userTags={userTags}
          onRepost={handleRepost}
          isReposting={isReposting}
        />
      )}
    </main>
  );
}
