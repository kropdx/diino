'use client';

import { useState, useEffect } from 'react';
import { User, UserTag, CanonicalTag } from '@prisma/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Search, Check } from 'lucide-react';

interface UserTagWithTag extends UserTag {
  tag: CanonicalTag;
  storyCount: number;
  isFollowing?: boolean;
}

interface UserProfileProps {
  user: User;
  isOwnProfile: boolean;
  userTags: UserTagWithTag[];
}

export function UserProfile({ user, isOwnProfile, userTags: initialTags }: UserProfileProps) {
  const [tags, setTags] = useState<UserTagWithTag[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingTags, setFollowingTags] = useState<Set<string>>(new Set());
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  // Initialize following status
  useEffect(() => {
    const following = new Set<string>();
    initialTags.forEach((tag) => {
      if (tag.isFollowing) {
        following.add(tag.id);
      }
    });
    setFollowingTags(following);
  }, [initialTags]);

  const filteredTags = tags.filter((userTag) =>
    userTag.tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTag = async () => {
    if (!newTag.trim() || !isOwnProfile) return;

    setIsAddingTag(true);
    try {
      const response = await fetch('/api/user/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagName: newTag }),
      });

      if (response.ok) {
        const newUserTag = await response.json();
        setTags([...tags, newUserTag]);
        setNewTag('');
      } else {
        const error = await response.json();
        console.error('Failed to add tag:', error);
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (userTagId: string) => {
    if (!isOwnProfile) return;

    console.log('Attempting to delete tag with ID:', userTagId);

    try {
      const response = await fetch(`/api/user/tags/${userTagId}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        setTags(tags.filter((t) => t.id !== userTagId));

        // Show success message about trash system
        if (responseData.storiesMovedToTrash > 0) {
          alert(responseData.message); // "Tag deleted successfully. X stories moved to trash."
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to delete tag:', errorData);

        // Show user-friendly error message
        if (errorData.message) {
          alert(errorData.message);
        } else {
          alert('Failed to delete tag. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const handleFollowTag = async (userTagId: string) => {
    if (isOwnProfile) return; // Can't follow your own tags

    try {
      const response = await fetch(`/api/user/tags/${userTagId}/follow`, {
        method: 'POST',
      });

      if (response.ok) {
        setFollowingTags((prev) => new Set([...prev, userTagId]));
      } else {
        console.error('Failed to follow tag');
      }
    } catch (error) {
      console.error('Error following tag:', error);
    }
  };

  const handleUnfollowTag = async (userTagId: string) => {
    if (isOwnProfile) return; // Can't unfollow your own tags

    try {
      const response = await fetch(`/api/user/tags/${userTagId}/follow`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFollowingTags((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userTagId);
          return newSet;
        });
      } else {
        console.error('Failed to unfollow tag');
      }
    } catch (error) {
      console.error('Error unfollowing tag:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.profileImageOptUrl || undefined} />
          <AvatarFallback className="text-2xl">
            {user.username?.slice(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold">{user.displayName || user.username}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
          {user.bio && <p className="text-sm">{user.bio}</p>}
          {user.url && (
            <a
              href={user.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline inline-flex items-center gap-1"
            >
              {user.url.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>

      {/* Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Interest Tags</CardTitle>
          <CardDescription>
            {isOwnProfile
              ? 'Add tags to showcase your interests'
              : `${user.displayName || user.username}'s interests`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {filteredTags.map((userTag) => (
              <Badge
                key={userTag.id}
                variant="secondary"
                className="px-3 py-1 text-sm flex items-center gap-1"
              >
                {userTag.tag.name}
                <Badge
                  variant="outline"
                  className="ml-1 px-1 py-0 text-xs h-4 min-w-[20px] justify-center"
                >
                  {userTag.storyCount}
                </Badge>
                {isOwnProfile ? (
                  <button
                    onClick={() => handleRemoveTag(userTag.id)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  // Show follow/unfollow button for other users' tags
                  <Button
                    onClick={() =>
                      followingTags.has(userTag.id)
                        ? handleUnfollowTag(userTag.id)
                        : handleFollowTag(userTag.id)
                    }
                    onMouseEnter={() => setHoveredTag(userTag.id)}
                    onMouseLeave={() => setHoveredTag(null)}
                    variant={
                      followingTags.has(userTag.id)
                        ? hoveredTag === userTag.id
                          ? 'destructive'
                          : 'secondary'
                        : 'outline'
                    }
                    size="sm"
                    className="ml-2 h-6 px-2 text-xs transition-all duration-200"
                  >
                    {followingTags.has(userTag.id) ? (
                      hoveredTag === userTag.id ? (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Following
                        </>
                      )
                    ) : (
                      'Follow'
                    )}
                  </Button>
                )}
              </Badge>
            ))}
          </div>

          {/* Add Tag */}
          {isOwnProfile && (
            <div className="flex gap-2">
              <Input
                placeholder="Add a new tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                disabled={isAddingTag}
              />
              <Button onClick={handleAddTag} disabled={!newTag.trim() || isAddingTag} size="sm">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats - TODO: Add aggregate counts when needed */}
    </div>
  );
}
