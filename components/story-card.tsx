// Adapted from legacy implementation
'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MoreHorizontal, Trash2, Bookmark, Repeat2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { FaviconImage } from '@/components/favicon-image';
import CommentsSection from '@/components/CommentsSection';

// ... (interface definitions identical to legacy) ...
interface StoryCardProps {
  story: {
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
  };
  onUpvote?: (storyId: string) => void;
  isUpvoting?: boolean;
  onDelete?: (storyId: string) => void;
  onBookmark?: (storyId: string) => void;
  isBookmarking?: boolean;
  onRepost?: (story: StoryCardProps['story']) => void;
}

export function StoryCard({
  story,
  onUpvote,
  isUpvoting,
  onDelete,
  onBookmark,
  isBookmarking,
  onRepost,
}: StoryCardProps) {
  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onUpvote && !isUpvoting) {
      onUpvote(story.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && confirm('Are you sure you want to delete this story?')) {
      onDelete(story.id);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBookmark && !isBookmarking) {
      onBookmark(story.id);
    }
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRepost) {
      onRepost(story);
    }
  };

  const renderContent = () => {
    // (retain legacy implementation for story types)
    if (story.storyType === 'URL' && story.url) {
      return (
        <div className="space-y-2">
          {story.content && <p className="text-sm whitespace-pre-wrap">{story.content}</p>}
          <div
            className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors group cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (story.url) window.open(story.url, '_blank', 'noopener,noreferrer');
            }}
          >
            <FaviconImage url={story.favicon} blobUrl={story.faviconBlobUrl} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {story.title || new URL(story.url!).hostname}
              </p>
              <p className="text-xs text-muted-foreground truncate">{story.url}</p>
            </div>
          </div>
        </div>
      );
    }
    return <p className="text-sm whitespace-pre-wrap">{story.content}</p>;
  };

  return (
    <Card className="p-4 space-y-3 hover:shadow-md transition-shadow">
      {/* Header & Content wrapped in link for permalink */}
      <Link href={`/${story.author.username}/${story.userTag.tag.name}/${story.shortId}`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{story.author.displayName || story.author.username}</span>
              <span className="text-muted-foreground">@{story.author.username}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {story.userTag.tag.name}
                {story.subtag && `.${story.subtag}`}
              </Badge>
            </div>
          </div>

          {renderContent()}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleUpvote}
          disabled={isUpvoting}
          className={cn(
            'flex items-center gap-1 text-sm transition-colors',
            story.hasUpvoted ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
            isUpvoting && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Heart className={cn('w-4 h-4', story.hasUpvoted && 'fill-current')} />
          <span>{story.upvotes}</span>
        </button>
        <button
          onClick={handleRepost}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-green-500"
        >
          <Repeat2 className="w-4 h-4" />
          {story.repostCount && story.repostCount > 0 && <span>{story.repostCount}</span>}
        </button>
        <button
          onClick={handleBookmark}
          disabled={isBookmarking}
          className={cn(
            'flex items-center gap-1 text-sm transition-colors',
            story.hasBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary',
            isBookmarking && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Bookmark className={cn('w-4 h-4', story.hasBookmarked && 'fill-current')} />
        </button>
      </div>

      {/* Comments */}
      <CommentsSection storyId={story.id} />
    </Card>
  );
} 