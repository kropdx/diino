'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2 } from 'lucide-react';

interface CanonicalTag {
  tag_id: string;
  name: string;
  created_at: string;
}

interface UserTag {
  user_tag_id: string;
  user_id: string;
  tag_id: string;
  credibility_score: number;
  follower_count: number;
  created_at: string;
  updated_at: string;
  tag: CanonicalTag;
  story_count: number;
}

export function TagManager() {
  const [tags, setTags] = useState<UserTag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's tags on mount
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      const data = await response.json();
      setTags(data);
    } catch (err) {
      setError('Failed to load tags');
      console.error('Error fetching tags:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagName: newTag }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create tag');
      }

      const newUserTag = await response.json();
      setTags([newUserTag, ...tags]);
      setNewTag('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Tags</CardTitle>
        <CardDescription>
          Create tags to organize your stories. You need at least one tag to post.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tag creation input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter a new tag name..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isCreating && handleCreateTag()}
            disabled={isCreating}
          />
          <Button 
            onClick={handleCreateTag} 
            disabled={!newTag.trim() || isCreating}
            size="sm"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Tags list */}
        <div className="space-y-2">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tags yet. Create your first tag to start posting!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((userTag) => (
                <Badge 
                  key={userTag.user_tag_id} 
                  variant="secondary"
                  className="px-3 py-1"
                >
                  #{userTag.tag.name}
                  <span className="ml-2 text-xs opacity-60">
                    {userTag.story_count} {userTag.story_count === 1 ? 'story' : 'stories'}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 