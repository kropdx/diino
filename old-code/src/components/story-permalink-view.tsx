'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StoryCard } from '@/components/story-card';

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
  originalStory?: {
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
  } | null;
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

interface StoryPermalinkViewProps {
  story: Story;
  currentUserId?: string;
}

export function StoryPermalinkView({
  story: initialStory,
  currentUserId,
}: StoryPermalinkViewProps) {
  const router = useRouter();
  const [story, setStory] = useState<Story>(initialStory);

  const handleUpvote = async (storyId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const { liked, upvotes } = await response.json();
        setStory({ ...story, hasUpvoted: liked, upvotes });
      }
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const handleDelete = async (storyId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Redirect to home page after successful deletion
        router.push('/home');
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
      if (story.hasBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?storyId=${storyId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setStory({ ...story, hasBookmarked: false });
        }
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId }),
        });

        if (response.ok) {
          setStory({ ...story, hasBookmarked: true });
        }
      }
    } catch (error) {
      console.error('Error bookmarking story:', error);
    }
  };

  return (
    <StoryCard
      story={story}
      onUpvote={handleUpvote}
      isUpvoting={false}
      onDelete={currentUserId && story.author.id === currentUserId ? handleDelete : undefined}
      onBookmark={handleBookmark}
      isBookmarking={false}
    />
  );
}
