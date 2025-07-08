'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { StoryUrlDisplay } from '@/components/story-url-display';

interface UserTag {
  id: string;
  tag: {
    id: string;
    name: string;
  };
}

interface RepostModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  userTags: UserTag[];
  onRepost: (commentary: string, userTagId: string, subtag?: string) => void;
  isReposting?: boolean;
}

export function RepostModal({
  isOpen,
  onClose,
  story,
  userTags,
  onRepost,
  isReposting = false,
}: RepostModalProps) {
  const [commentary, setCommentary] = useState('');
  const [selectedTagId, setSelectedTagId] = useState(userTags[0]?.id || '');
  const [subtag, setSubtag] = useState('');

  // Extract hashtag from commentary and auto-select matching tag
  useEffect(() => {
    const match = commentary.match(/#(\w+)(?:\.(\w+))?/);
    if (match) {
      const tagName = match[1];
      const subtagName = match[2] || '';

      // Find matching user tag
      const matchingTag = userTags.find((ut) => ut.tag.name === tagName);
      if (matchingTag) {
        setSelectedTagId(matchingTag.id);
        setSubtag(subtagName);
      }
    }
  }, [commentary, userTags]);

  // Get the selected tag
  const selectedTag = userTags.find((ut) => ut.id === selectedTagId);

  const handleSubmit = () => {
    if (selectedTagId) {
      onRepost(commentary, selectedTagId, subtag || undefined);
    }
  };

  const renderOriginalContent = () => {
    if (story.storyType === 'URL' && story.url) {
      return (
        <div className="space-y-2">
          {story.content && (
            <p className="text-sm text-foreground whitespace-pre-wrap">{story.content}</p>
          )}
          <StoryUrlDisplay
            url={story.url}
            title={story.title || new URL(story.url).hostname}
            favicon={story.favicon}
            faviconBlobUrl={story.faviconBlobUrl}
          />
        </div>
      );
    }

    return <p className="text-sm text-foreground whitespace-pre-wrap">{story.content}</p>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Repost Story</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Commentary input */}
          <div className="space-y-2">
            <Label htmlFor="commentary">Add your thoughts (optional)</Label>
            <Textarea
              id="commentary"
              placeholder="What are your thoughts on this?"
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Tag selector */}
          <div className="space-y-2">
            <Label htmlFor="tag">Post as</Label>
            <Select value={selectedTagId} onValueChange={setSelectedTagId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tag">
                  {selectedTag && (
                    <span>
                      #{selectedTag.tag.name}
                      {subtag && `.${subtag}`}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {userTags.map((userTag) => (
                  <SelectItem key={userTag.id} value={userTag.id}>
                    #{userTag.tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Original story preview */}
          <div className="space-y-2">
            <Label>Original story</Label>
            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
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
                  <Badge variant="secondary" className="text-xs">
                    {story.userTag.tag.name}
                    {story.subtag && `.${story.subtag}`}
                  </Badge>
                </div>
                {renderOriginalContent()}
              </div>
            </Card>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isReposting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isReposting || !selectedTagId}>
              {isReposting ? 'Reposting...' : 'Repost'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
