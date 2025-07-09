'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Tag, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Story {
  story_id: string;
  short_id: string;
  content: string;
  url: string | null;
  title: string | null;
  favicon: string | null;
  subtag: string | null;
  created_at: string;
  author: {
    username: string;
    display_name: string | null;
  };
  user_tag: {
    tag: {
      name: string;
    };
  };
}

export default function TagFeedPage() {
  const params = useParams();
  const tagName = params.tagName as string;
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('TagFeedPage rendering for tag:', tagName);

  useEffect(() => {
    const fetchTagFeed = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching tag feed for:', tagName);
        const response = await fetch(`/api/feed/tag/${encodeURIComponent(tagName)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tag feed');
        }
        
        const data = await response.json();
        console.log('Fetched tag feed:', data);
        setStories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTagFeed();
  }, [tagName]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">
          Error loading feed: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Tag className="size-8" />
          #{tagName}
        </h1>
        <p className="text-muted-foreground mt-2">
          Live feed from people you follow
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : stories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No stories found with this tag from people you follow.</p>
              <p className="text-sm text-muted-foreground mt-2">Follow more people to see their #{tagName} posts here!</p>
            </CardContent>
          </Card>
        ) : (
          stories.map((story) => (
            <Card key={story.story_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-xs">
                        {story.author.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Link 
                      href={`/${story.author.username}`}
                      className="text-sm font-medium hover:underline"
                    >
                      @{story.author.username}
                    </Link>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(story.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-primary">
                      #{story.user_tag.tag.name}
                      {story.subtag && `.${story.subtag}`}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={`/${story.author.username}/${story.short_id}`}>
                  <p className="text-sm whitespace-pre-wrap mb-3">{story.content}</p>
                  
                  {story.url && (
                    <div className="border rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-2">
                        {story.favicon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={story.favicon} 
                            alt="" 
                            className="size-4 mt-0.5"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {story.title || story.url}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <ExternalLink className="size-3" />
                            {new URL(story.url).hostname.replace('www.', '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 