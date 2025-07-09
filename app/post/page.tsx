'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import NaviBar from '@/components/NaviBar';
import { TagManager } from '@/components/TagManager';

interface UserTag {
  user_tag_id: string;
  user_id: string;
  tag_id: string;
  tag: {
    tag_id: string;
    name: string;
  };
}

export default function PostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  // Fetch user's tags
  useEffect(() => {
    if (!user) return;
    
    fetchUserTags();
  }, [user]);

  const fetchUserTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      const data = await response.json();
      setUserTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handlePost = async (
    content: string,
    userTagId: string,
    urlInfo?: {
      url: string;
      title: string;
      favicon: string | null;
      faviconBlobUrl?: string | null;
    },
    subtag?: string
  ) => {
    setIsPosting(true);
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userTagId,
          url: urlInfo?.url,
          title: urlInfo?.title,
          favicon: urlInfo?.favicon,
          faviconBlobUrl: urlInfo?.faviconBlobUrl,
          subtag,
          storyType: urlInfo ? 'URL' : 'TEXT',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post story');
      }

      await response.json();
      
      // Redirect to home page after successful post
      router.push('/home');
    } catch (error) {
      console.error('Error posting story:', error);
      alert(error instanceof Error ? error.message : 'An error occurred while posting');
    } finally {
      setIsPosting(false);
    }
  };

  // Convert UserTag format to match NaviBar expectations
  const formattedUserTags = userTags.map(ut => ({
    id: ut.user_tag_id,
    tag: {
      id: ut.tag.tag_id,
      name: ut.tag.name
    }
  }));

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="p-6">
            <p>Please log in to create posts.</p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full p-4 gap-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create a Post</h1>
        
        {/* Tag Manager Section */}
        <div className="mb-6">
          <TagManager />
        </div>

        {/* Post Creation Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Share Your Story</h2>
          {userTags.length > 0 ? (
            <NaviBar
              onSubmit={handlePost}
              userTags={formattedUserTags}
              isPosting={isPosting}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">You need at least one tag to start posting.</p>
              <p className="text-sm">Create a tag above to get started!</p>
            </div>
          )}
        </Card>

        {/* Tips Section */}
        <Card className="p-4 bg-muted/50">
          <h3 className="font-medium mb-2">Tips:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Include a #tag in your post to categorize it</li>
            <li>• Use #tag.subtag for more specific categorization</li>
            <li>• URLs will automatically generate previews</li>
            <li>• Press Enter to post, Shift+Enter for new line</li>
          </ul>
        </Card>
      </div>
    </AppLayout>
  );
} 