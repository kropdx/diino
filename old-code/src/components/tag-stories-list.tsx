'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StoryCard } from '@/components/story-card';

interface Story {
  id: string;
  shortId: string;
  content: string | null;
  url: string | null;
  title: string | null;
  favicon: string | null;
  subtag: string | null;
  storyType: string;
  createdAt: string;
  upvotes: number;
  hasUpvoted: boolean;
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

interface TagStoriesListProps {
  initialStories: Story[];
  displayTitle: string;
}

export function TagStoriesList({ initialStories, displayTitle }: TagStoriesListProps) {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [currentDbUser, setCurrentDbUser] = useState<{
    id: string;
    username: string | null;
  } | null>(null);
  const [stories, setStories] = useState<Story[]>(initialStories);

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
    async function loadCurrentUser() {
      if (!user) return;

      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setCurrentDbUser(userData);
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    }

    loadCurrentUser();
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
      } else {
        const error = await response.json();
        console.error('Error upvoting story:', error.error);
      }
    } catch (error) {
      console.error('Error upvoting story:', error);
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

  return (
    <div className="space-y-4">
      {stories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No stories found for {displayTitle}</p>
        </div>
      ) : (
        stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            onUpvote={handleUpvote}
            onDelete={
              currentDbUser && story.author.id === currentDbUser.id ? handleDelete : undefined
            }
          />
        ))
      )}
    </div>
  );
}
