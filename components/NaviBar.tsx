'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { find } from 'linkifyjs';

// Custom small arrow component
const SmallArrow = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="opacity-40">
    <path d="M3.5 2L8.5 6L3.5 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

// Validate subtag format
const isValidSubtag = (subtag: string): boolean => {
  return /^[a-zA-Z0-9_-]+$/.test(subtag);
};

// Helper function to find the last tag in the text
const findLastTag = (
  text: string,
  availableTags: { id: string; name: string }[]
): {
  id?: string;
  name: string;
  displayText: string;
  subtag?: string;
  invalidSubtag?: boolean;
  isNew?: boolean;
} | null => {
  // Regex to capture tags with optional subtags
  const tagRegex = /#([a-zA-Z0-9_-]+)(?:\.([a-zA-Z0-9_-]+))?(?:\s|$)/g;

  let lastMatch: {
    id?: string;
    name: string;
    displayText: string;
    subtag?: string;
    invalidSubtag?: boolean;
    isNew?: boolean;
  } | null = null;
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    const tagName = match[1].toLowerCase();
    const subtag = match[2];
    const foundTag = availableTags.find((t) => t.name.toLowerCase() === tagName);

    if (foundTag) {
      lastMatch = {
        ...foundTag,
        displayText: subtag ? `#${foundTag.name}.${subtag}` : `#${foundTag.name}`,
        subtag,
        invalidSubtag: subtag ? !isValidSubtag(subtag) : false,
        isNew: false,
      };
    } else {
      lastMatch = {
        name: tagName,
        displayText: subtag ? `#${tagName}.${subtag}` : `#${tagName}`,
        subtag,
        invalidSubtag: subtag ? !isValidSubtag(subtag) : false,
        isNew: true,
      };
    }
  }

  return lastMatch;
};

interface UserTag {
  id: string;
  tag: {
    id: string;
    name: string;
  };
}

interface NaviBarProps {
  userTags: UserTag[];
  onSubmit: (
    content: string,
    userTagId: string,
    urlInfo?: {
      url: string;
      title: string;
      favicon: string | null;
      faviconBlobUrl?: string | null;
    },
    subtag?: string
  ) => Promise<void>;
  isPosting: boolean;
}

export default function NaviBar({ onSubmit, userTags, isPosting }: NaviBarProps) {
  const [inputText, setInputText] = useState('');
  const [matchedTag, setMatchedTag] = useState<{
    id?: string;
    name: string;
    displayText?: string;
    subtag?: string;
    invalidSubtag?: boolean;
    isNew?: boolean;
  } | null>(null);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [urlInfo, setUrlInfo] = useState<{
    url: string;
    title: string;
    favicon: string | null;
    faviconBlobUrl?: string | null;
  } | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastProcessedUrl = useRef<string | null>(null);

  const availableTags = userTags.map((userTag) => ({
    id: userTag.tag.id,
    name: userTag.tag.name,
  }));

  // Fetch URL metadata
  const fetchUrlMetadata = async (url: string) => {
    try {
      setIsLoadingUrl(true);
      const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);

      if (response.ok) {
        const data = await response.json();
        setUrlInfo({
          url: data.url,
          title: data.title,
          favicon: data.favicon,
          faviconBlobUrl: data.faviconBlobUrl,
        });
      } else {
        // Fallback
        const fallbackUrl = url.startsWith('http') ? url : `https://${url}`;
        setUrlInfo({
          url: fallbackUrl,
          title: new URL(fallbackUrl).hostname.replace('www.', ''),
          favicon: null,
          faviconBlobUrl: null,
        });
      }
    } catch (error) {
      console.error('Error fetching URL metadata:', error);
      // Simple fallback
      setUrlInfo({
        url,
        title: url,
        favicon: null,
        faviconBlobUrl: null,
      });
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);

    // Check for tags
    const tag = findLastTag(text, availableTags);
    if (tag) {
      setMatchedTag(tag);
    } else if (inputText.includes('#') && !text.includes('#')) {
      // User removed hashtag
      setMatchedTag(null);
    }

    // Extract URL
    const textWithoutHashtags = text.replace(/#[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)?/g, '');
    const urls = find(textWithoutHashtags, 'url');

    if (urls && urls.length > 0) {
      const urlMatch = urls[0];
      const detectedUrl = urlMatch.href;

      if (detectedUrl.startsWith('http://') || detectedUrl.startsWith('https://')) {
        const originalUrl = urlMatch.value;
        const urlPattern = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const hasSpaceAfter =
          new RegExp(`${urlPattern}\\s`).test(text) || text.trim().endsWith(originalUrl);

        if (hasSpaceAfter && detectedUrl !== lastProcessedUrl.current) {
          lastProcessedUrl.current = detectedUrl;
          fetchUrlMetadata(detectedUrl);
        }
      }
    } else {
      setUrlInfo(null);
      lastProcessedUrl.current = null;
    }
  };

  const handleSubmit = async () => {
    if (inputText.trim() && matchedTag && !isPosting && !matchedTag.invalidSubtag) {
      let userTagId: string;

      if (matchedTag.isNew) {
        // Create new tag first
        setIsCreatingTag(true);
        try {
          const response = await fetch('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tagName: matchedTag.name }),
          });

          if (!response.ok) {
            throw new Error('Failed to create tag');
          }

          const newUserTag = await response.json();
          userTagId = newUserTag.user_tag_id;
        } catch (error) {
          console.error('Error creating tag:', error);
          setIsCreatingTag(false);
          return;
        }
        setIsCreatingTag(false);
      } else {
        // Use existing tag
        const userTag = userTags.find((ut) => ut.tag.id === matchedTag.id);
        if (!userTag) return;
        userTagId = userTag.id;
      }

      await onSubmit(inputText, userTagId, urlInfo || undefined, matchedTag.subtag);

      // Clear form
      setInputText('');
      setMatchedTag(null);
      setUrlInfo(null);
      lastProcessedUrl.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div>
      <div className="relative">
        <div className="w-full rounded border border-border bg-card p-4">
          <textarea
            ref={textareaRef}
            className="w-full min-h-[80px] p-2 text-foreground bg-transparent focus:outline-none resize-none"
            placeholder="Share your story... (include a #tag)"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isPosting}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-muted-foreground">
              Press Enter to post • Shift+Enter for new line
            </div>
            <button
              onClick={handleSubmit}
              disabled={
                !inputText.trim() ||
                !matchedTag ||
                isPosting ||
                matchedTag.invalidSubtag ||
                isCreatingTag
              }
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded transition-all duration-200',
                inputText.trim() && matchedTag && !matchedTag.invalidSubtag && !isCreatingTag
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {isCreatingTag ? 'Creating...' : isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Tag and URL preview */}
      {(urlInfo || matchedTag) && (
        <div className="flex flex-col gap-2 mt-2 px-1">
          {matchedTag && (
            <div className="flex items-center gap-2">
              <SmallArrow />
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    matchedTag.invalidSubtag
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {matchedTag.subtag
                    ? `#${matchedTag.name}.${matchedTag.subtag}`
                    : `#${matchedTag.name}`}
                  {matchedTag.invalidSubtag && ' ⚠️'}
                </span>
                {matchedTag.isNew && !matchedTag.invalidSubtag && (
                  <span className="text-xs text-blue-500">(new tag)</span>
                )}
              </div>
            </div>
          )}

          {urlInfo && (
            <div className="flex items-center gap-2">
              <SmallArrow />
              <div className="flex items-center gap-2">
                {isLoadingUrl ? (
                  <div className="w-3 h-3 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
                ) : (
                  <span className="text-xs text-muted-foreground">{urlInfo.title}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 