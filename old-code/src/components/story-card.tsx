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
    e.preventDefault(); // Prevent navigation when clicking the heart
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
    e.preventDefault(); // Prevent navigation when clicking the bookmark
    if (onBookmark && !isBookmarking) {
      onBookmark(story.id);
    }
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the repost
    if (onRepost) {
      onRepost(story);
    }
  };

  const renderContent = () => {
    if (story.storyType === 'REPOST') {
      return (
        <div className="space-y-3">
          {/* Repost commentary */}
          {story.commentary && (
            <p className="text-sm text-foreground whitespace-pre-wrap">{story.commentary}</p>
          )}

          {/* Check if original story exists */}
          {story.originalStory ? (
            /* Original story in a nested card */
            <Card className="p-3 bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {story.originalStory.author.displayName || story.originalStory.author.username}
                  </span>
                  <span className="text-muted-foreground">
                    @{story.originalStory.author.username}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(story.originalStory.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {story.originalStory.userTag.tag.name}
                  </Badge>
                </div>

                {/* Original story content */}
                {story.originalStory.storyType === 'URL' && story.originalStory.url ? (
                  <div className="space-y-2">
                    {story.originalStory.content && (
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {story.originalStory.content}
                      </p>
                    )}
                    <div
                      className="flex items-center gap-2 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors group cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (story.originalStory?.url)
                          window.open(story.originalStory.url, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <FaviconImage
                        url={story.originalStory.favicon}
                        blobUrl={story.originalStory.faviconBlobUrl}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {story.originalStory.title || new URL(story.originalStory.url).hostname}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {story.originalStory.url}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {story.originalStory.content}
                  </p>
                )}
              </div>
            </Card>
          ) : (
            /* Show deleted story message */
            <Card className="p-3 bg-muted/30">
              <p className="text-sm text-muted-foreground italic">Original story was deleted</p>
            </Card>
          )}
        </div>
      );
    }

    if (story.storyType === 'URL' && story.url) {
      return (
        <div className="space-y-2">
          {story.content && (
            <p className="text-sm text-foreground whitespace-pre-wrap">{story.content}</p>
          )}
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

    return <p className="text-sm text-foreground whitespace-pre-wrap">{story.content}</p>;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <Link href={`/${story.author.username}/${story.shortId}`}>
        <div className="space-y-3">
          {/* Repost indicator */}
          {story.storyType === 'REPOST' && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Repeat2 className="w-3 h-3" />
              <span>Reposted</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {story.author.displayName || story.author.username}
              </span>
              <span className="text-muted-foreground text-sm">@{story.author.username}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {story.userTag.tag.name}
                {story.subtag && `.${story.subtag}`}
              </Badge>
              {onDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1 hover:bg-muted rounded-sm transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete story
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {renderContent()}

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
              className="flex items-center gap-1 text-sm transition-colors text-muted-foreground hover:text-green-500"
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
        </div>
      </Link>
    </Card>
  );
}
