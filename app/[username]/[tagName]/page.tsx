'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Tag, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import CommentsSection from '@/components/CommentsSection';

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

export default function UserTagPage() {
  const params = useParams();
  const username = params.username as string;
  const tagName = params.tagName as string;
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('UserTagPage rendering for user:', username, 'tag:', tagName);

  useEffect(() => {
    const fetchUserTagStories = async () => {
      try {
        setIsLoading(true);
        const [baseTag, sub] = tagName.split('.');
        console.log('Fetching stories for user:', username, 'tag:', baseTag, 'subtag:', sub);
        const url = `/api/users/${encodeURIComponent(username)}/stories?tag=${encodeURIComponent(baseTag)}${sub ? `&subtag=${encodeURIComponent(sub)}` : ''}`;
        const response = await fetch(url);
        
        if (response.status === 404) {
          notFound();
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch stories');
        }
        
        const data = await response.json();
        console.log('Fetched user tag stories:', data);
        setStories(data);
      } catch (err) {
        if (err instanceof Error && err.message === 'Failed to fetch stories') {
          setError(err.message);
        } else {
          setError('An error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTagStories();
  }, [username, tagName]);

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
          Error loading stories: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Tag className="size-8" />
          #{tagName}
        </h1>
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="text-xs">
              {username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Link 
            href={`/${username}`}
            className="text-sm font-medium hover:underline text-muted-foreground"
          >
            @{username}&apos;s posts
          </Link>
        </div>
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
              <p className="text-muted-foreground">@{username} hasn&apos;t posted anything with #{tagName} yet.</p>
            </CardContent>
          </Card>
        ) : (
          stories.map((story) => (
            <Card key={story.story_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(story.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Link
                      href={`/${story.author.username}/${story.user_tag.tag.name}${story.subtag ? `.${story.subtag}` : ''}`}
                      className="text-primary hover:underline"
                    >
                      #{story.user_tag.tag.name}
                      {story.subtag && `.${story.subtag}`}
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={`/${story.author.username}/${story.user_tag.tag.name}/${story.short_id}`}> 
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
                <CommentsSection storyId={story.story_id} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}