'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ExternalLink, Tag as TagIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase/client';

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

export default function StoryPermalinkPage() {
  const params = useParams();
  const username = params.username as string;
  const tagName = params.tagName as string;
  const shortId = params.shortId as string;

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('Story')
          .select('*')
          .eq('short_id', shortId)
          .maybeSingle();

        if (error || !data) {
          notFound();
          return;
        }

        // TODO: eager-fetch author & tag via rpc or separate queries; for now only set if username matches
        if (data.author_id || data.user_tag_id) {
          // fetch related rows
          const [{ data: authorData }, { data: userTagData }] = await Promise.all([
            supabase.from('User').select('username, display_name').eq('user_id', data.author_id).maybeSingle(),
            supabase.from('UserTag').select('tag_id').eq('user_tag_id', data.user_tag_id).maybeSingle(),
          ]);

          const tagRow = userTagData ? await supabase.from('CanonicalTag').select('name').eq('tag_id', userTagData.tag_id).maybeSingle() : { data: null };

          const storyObj: Story = {
            story_id: data.story_id,
            short_id: data.short_id,
            content: data.content,
            url: data.url,
            title: data.title,
            favicon: data.favicon,
            subtag: data.subtag,
            created_at: data.created_at,
            author: {
              username: authorData?.username ?? username,
              display_name: authorData?.display_name ?? null,
            },
            user_tag: {
              tag: {
                name: (tagRow as any).data?.name ?? tagName,
              },
            },
          };

          setStory(storyObj);
        } else {
          setError('Story data incomplete');
        }
      } catch (err) {
        setError('Failed to load story');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [username, tagName, shortId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {isLoading || !story ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card>
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
            <p className="text-sm whitespace-pre-wrap mb-3">{story.content}</p>
            {story.url && (
              <div className="border rounded-lg p-3 bg-muted/30">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
} 