'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StoryCard } from '@/components/story-card';
import { Trash2, RotateCcw } from 'lucide-react';

interface TrashData {
  count: number;
  stories: {
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
      username: string | null;
      displayName: string | null;
    };
    userTag: {
      tag: {
        name: string;
      };
    };
  }[];
}

export function TrashManager() {
  const [trashData, setTrashData] = useState<TrashData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrashData();
  }, []);

  const fetchTrashData = async () => {
    try {
      const response = await fetch('/api/user/trash');
      if (response.ok) {
        const data = await response.json();
        setTrashData(data);
      }
    } catch (error) {
      console.error('Error fetching trash data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async (storyId: string) => {
    // Upvoting works the same for trash stories
    try {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const { liked, upvotes } = await response.json();
        // Update the story in the local state
        if (trashData) {
          const updatedStories = trashData.stories.map((story) =>
            story.id === storyId ? { ...story, hasUpvoted: liked, upvotes } : story
          );
          setTrashData({ ...trashData, stories: updatedStories });
        }
      }
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const handlePermanentDelete = async (storyId: string) => {
    if (
      !confirm('Are you sure you want to permanently delete this story? This cannot be undone.')
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the story from the local state
        if (trashData) {
          const updatedStories = trashData.stories.filter((story) => story.id !== storyId);
          setTrashData({
            count: updatedStories.length,
            stories: updatedStories,
          });
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete story');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('An error occurred while deleting the story');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
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
      </div>
    );
  }

  if (!trashData || trashData.count === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No stories in trash</h3>
          <p className="text-muted-foreground">
            When you delete tags, their stories will be moved here for safekeeping.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                {trashData.count} story{trashData.count === 1 ? '' : 's'} in trash
              </h3>
              <p className="text-sm text-muted-foreground">
                Stories moved here when tags were deleted
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore (Coming Soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stories */}
      <div className="max-w-2xl mx-auto space-y-4">
        {trashData.stories.map((story) => (
          <div key={story.id} className="relative">
            <StoryCard
              story={story}
              onUpvote={handleUpvote}
              isUpvoting={false}
              onDelete={handlePermanentDelete}
            />

            {/* Trash indicator - positioned to avoid all content overlap */}
            <div className="absolute bottom-2 right-2 bg-destructive/10 text-destructive px-2 py-1 rounded-md text-xs font-medium">
              Trash
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
