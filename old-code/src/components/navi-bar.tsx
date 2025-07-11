'use client';

import React, { useState, useRef } from 'react';
import { GlowingEffect } from './ui/glowing-effect';
import { cn } from '@/lib/utils';
import { find } from 'linkifyjs';
import { useSidebar } from '@/contexts/sidebar-context';
import { FaviconImage } from '@/components/favicon-image';

// Custom small arrow component with shorter horizontal line
const SmallArrow = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="opacity-40">
    <path d="M3.5 2L8.5 6L3.5 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

// Validate subtag format
const isValidSubtag = (subtag: string): boolean => {
  return /^[a-zA-Z0-9_-]+$/.test(subtag);
};

// Helper function to find the last tag (valid or new) in the text
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
  // Regex to capture single-word tags with optional subtags - matches #tag or #tag.subtag
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

  // Check for single-word tags with optional subtags
  while ((match = tagRegex.exec(text)) !== null) {
    const tagName = match[1].toLowerCase();
    const subtag = match[2]; // This will be undefined if no subtag
    const foundTag = availableTags.find((t) => t.name.toLowerCase() === tagName);

    if (foundTag) {
      // Existing tag
      lastMatch = {
        ...foundTag,
        displayText: subtag ? `#${foundTag.name}.${subtag}` : `#${foundTag.name}`,
        subtag,
        invalidSubtag: subtag ? !isValidSubtag(subtag) : false,
        isNew: false,
      };
    } else {
      // New tag
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
  const { refreshSidebar } = useSidebar();
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
  const fetchedUrls = useRef<Set<string>>(new Set());
  // Use react-linkify for better URL detection

  // Convert userTags to the format expected by findLastValidTag
  const availableTags = userTags.map((userTag) => ({
    id: userTag.tag.id,
    name: userTag.tag.name,
  }));

  // Fetch URL metadata using the existing API
  const fetchUrlMetadata = async (url: string) => {
    console.log('fetchUrlMetadata called with URL:', url);
    try {
      setIsLoadingUrl(true);
      const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Fetch URL response:', data);
        setUrlInfo({
          url: data.url,
          title: data.title,
          favicon: data.favicon,
          faviconBlobUrl: data.faviconBlobUrl,
        });
        fetchedUrls.current.add(url);
      } else {
        // Fallback if API fails
        const fallbackUrl = url.startsWith('http') ? url : `https://${url}`;
        setUrlInfo({
          url: fallbackUrl,
          title: new URL(fallbackUrl).hostname.replace('www.', ''),
          favicon: null,
        });
        fetchedUrls.current.add(url);
      }
    } catch (error) {
      console.error('Error fetching URL metadata:', error);
      // Fallback if API fails
      const fallbackUrl = url.startsWith('http') ? url : `https://${url}`;
      try {
        setUrlInfo({
          url: fallbackUrl,
          title: new URL(fallbackUrl).hostname.replace('www.', ''),
          favicon: null,
        });
      } catch {
        // If URL is invalid, just use the original
        setUrlInfo({
          url: fallbackUrl,
          title: url,
          favicon: null,
        });
      }
      fetchedUrls.current.add(url);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);

    // Check for tags in the input
    const tag = findLastTag(text, availableTags);

    // Only update matchedTag if:
    // 1. A new tag is found in the text, OR
    // 2. There was a tag in the text before but now there isn't (clear the tag)
    if (tag) {
      // New tag found, update it
      setMatchedTag(tag);
    } else {
      // No tag in text - only clear if there was a hashtag before that's now removed
      const hadHashtag = inputText.includes('#');
      const hasHashtag = text.includes('#');

      if (hadHashtag && !hasHashtag) {
        // User removed the hashtag, clear the selection
        setMatchedTag(null);
      }
      // Otherwise, keep the manually selected tag
    }

    // Extract URL for display using linkifyjs - but exclude text that's part of hashtag patterns
    // Remove hashtag patterns first to avoid conflicts
    const textWithoutHashtags = text.replace(/#[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)?/g, '');
    const urls = find(textWithoutHashtags, 'url');

    if (urls && urls.length > 0) {
      const urlMatch = urls[0];
      const detectedUrl = urlMatch.href;

      // Only process URLs with valid protocols
      if (!detectedUrl.startsWith('http://') && !detectedUrl.startsWith('https://')) {
        setUrlInfo(null);
        setIsLoadingUrl(false);
        lastProcessedUrl.current = null;
        return;
      }

      // Check if URL is followed by space or end of text
      const originalUrl = urlMatch.value;
      const urlPattern = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hasSpaceAfter =
        new RegExp(`${urlPattern}\\s`).test(text) || text.trim().endsWith(originalUrl);

      // Only show URL preview when URL is complete AND looks like a real URL
      if (hasSpaceAfter) {
        // Additional validation: Check the original URL text pattern
        // Skip URLs that look incomplete (like www.ke, www.co, etc.)
        const originalUrlText = originalUrl.toLowerCase();

        // Skip if it's a common incomplete pattern
        if (originalUrlText.match(/^(www\.)?(\w{1,2}|co|com\w*|org\w*|net\w*)$/)) {
          setUrlInfo(null);
          setIsLoadingUrl(false);
          lastProcessedUrl.current = null;
          return;
        }

        // Additional check: URL should have reasonable domain structure
        const urlObj = new URL(detectedUrl);
        const hostname = urlObj.hostname;
        const parts = hostname.split('.');

        // Skip if domain doesn't look complete (needs at least domain.tld)
        if (parts.length < 2 || parts.some((part) => part.length < 2)) {
          setUrlInfo(null);
          setIsLoadingUrl(false);
          lastProcessedUrl.current = null;
          return;
        }

        if (detectedUrl !== lastProcessedUrl.current) {
          lastProcessedUrl.current = detectedUrl;

          // Fetch metadata for the URL
          fetchUrlMetadata(detectedUrl);
        }
      } else {
        // URL is still being typed, don't show preview yet
        setUrlInfo(null);
        setIsLoadingUrl(false);
        lastProcessedUrl.current = null;
      }
    } else {
      setUrlInfo(null);
      setIsLoadingUrl(false);
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
          const response = await fetch('/api/user/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tagName: matchedTag.name }),
          });

          if (!response.ok) {
            throw new Error('Failed to create tag');
          }

          const newUserTag = await response.json();
          userTagId = newUserTag.id;
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

      const hasSubtag = matchedTag.subtag;
      await onSubmit(inputText, userTagId, urlInfo || undefined, matchedTag.subtag);

      // If a subtag was used or new tag created, refresh the sidebar
      if ((hasSubtag || matchedTag.isNew) && refreshSidebar) {
        refreshSidebar();
      }

      // Clear form after successful submission
      setInputText('');
      setMatchedTag(null);
      setUrlInfo(null);
      setIsLoadingUrl(false);
      lastProcessedUrl.current = null;
      fetchedUrls.current.clear();
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
      {/* Main input bar */}
      <div className="transition-colors duration-300">
        <div className="relative">
          <div className="relative">
            <GlowingEffect
              disabled={false}
              proximity={150}
              spread={50}
              blur={4}
              movementDuration={1.2}
              borderWidth={2}
              className="absolute inset-0"
            />
            <div className="w-full rounded p-[1px] bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500">
              <div className="w-full bg-card rounded relative pt-4 pb-4 px-4 flex flex-col transition-colors duration-300">
                {/* Central input field area */}
                <div className="flex-grow flex items-center justify-between">
                  <textarea
                    ref={textareaRef}
                    className="w-full h-8 p-1 text-foreground bg-transparent focus:outline-none resize-none text-sm leading-relaxed transition-colors duration-300 placeholder-muted-foreground mr-2"
                    placeholder="Share your story... (include a #tag)"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={isPosting}
                    style={{
                      fontFamily: 'inherit',
                      letterSpacing: '0.01em',
                      fontWeight: 400, // Body text - IBM Plex Sans Regular
                    }}
                  />
                  <div className="flex items-center gap-2">
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
                        'px-3 py-1 text-xs font-medium rounded transition-all duration-200', // Button - IBM Plex Sans Medium
                        inputText.trim() &&
                          matchedTag &&
                          !matchedTag.invalidSubtag &&
                          !isCreatingTag
                          ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white hover:opacity-90'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {isCreatingTag ? 'CREATING...' : isPosting ? 'POSTING...' : 'POST'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer section - shows URL and tag info below the input */}
        {(urlInfo || matchedTag) && (
          <div className="flex flex-col gap-1 mt-1 px-1">
            {/* Tag display */}
            {matchedTag && (
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  <SmallArrow />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <div
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium', // Tag - IBM Plex Sans Medium
                        matchedTag.invalidSubtag
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-pink-500/20 text-foreground'
                      )}
                    >
                      {matchedTag.subtag
                        ? `#${matchedTag.name}.${matchedTag.subtag}`
                        : `#${matchedTag.name}`}
                      {matchedTag.invalidSubtag && ' ⚠️'}
                    </div>
                    {matchedTag.isNew && !matchedTag.invalidSubtag && (
                      <div className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-500">
                        {' '}
                        {/* New tag label - IBM Plex Sans Medium */}
                        (new tag)
                      </div>
                    )}
                    {isCreatingTag && (
                      <div className="w-3 h-3 animate-spin rounded-full border border-blue-500 border-t-transparent"></div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* URL preview */}
            {urlInfo && (
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  <SmallArrow />
                </div>
                <div className="flex items-center gap-1.5">
                  {isLoadingUrl ? (
                    <div className="w-3 h-3 animate-spin rounded-full border border-muted-foreground border-t-transparent"></div>
                  ) : (
                    <FaviconImage url={urlInfo.faviconBlobUrl || urlInfo.favicon} size="sm" />
                  )}
                  <span className="text-xs text-muted-foreground">{urlInfo.title}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
