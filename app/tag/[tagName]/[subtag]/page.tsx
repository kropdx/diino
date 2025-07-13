import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { StoryCard } from '@/components/story-card';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface Story {
  story_id: string;
  short_id: string;
  story_type: 'TEXT' | 'URL' | 'REPOST';
  content: string | null;
  url: string | null;
  title: string | null;
  favicon: string | null;
  favicon_blob_url: string | null;
  upvotes: number;
  created_at: string;
  updated_at: string;
  subtag: string | null;
  author: {
    user_id: string;
    username: string;
    display_name: string | null;
  };
  user_tag: {
    tag: {
      name: string;
    };
  };
}

export default async function SubtagPage({ 
  params 
}: { 
  params: Promise<{ tagName: string; subtag: string }> 
}) {
  const { tagName, subtag } = await params;
  const supabase = await createClient();

  // Get stories for this tag + subtag combination
  const { data: stories, error } = await supabase
    .from('Story')
    .select(`
      story_id,
      short_id,
      story_type,
      content,
      url,
      title,
      favicon,
      favicon_blob_url,
      upvotes,
      created_at,
      updated_at,
      subtag,
      author:User!Story_author_id_fkey(user_id, username, display_name),
      user_tag:UserTag!Story_user_tag_id_fkey(
        tag:CanonicalTag!UserTag_tag_id_fkey(name)
      )
    `)
    .eq('user_tag.tag.name', tagName)
    .eq('subtag', subtag)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stories:', error);
    notFound();
  }

  const typedStories = stories as unknown as Story[];
  const filteredStories = typedStories.filter(
    story => story.user_tag?.tag?.name === tagName && story.subtag === subtag
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <Link 
            href={`/tag/${tagName}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="size-4 mr-1" />
            Back to #{tagName}
          </Link>
          <h1 className="text-3xl font-bold">#{tagName}.{subtag}</h1>
          <p className="text-muted-foreground mt-2">
            Stories tagged with #{tagName}.{subtag}
          </p>
        </div>

        {filteredStories.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No stories found for #{tagName}.{subtag}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredStories.map((story) => (
              <StoryCard
                key={story.story_id}
                story={{
                  id: story.story_id,
                  shortId: story.short_id,
                  content: story.content,
                  url: story.url,
                  title: story.title,
                  favicon: story.favicon,
                  faviconBlobUrl: story.favicon_blob_url,
                  subtag: story.subtag,
                  storyType: story.story_type,
                  createdAt: story.created_at,
                  upvotes: story.upvotes,
                  author: {
                    id: story.author.user_id,
                    username: story.author.username,
                    displayName: story.author.display_name
                  },
                  userTag: story.user_tag
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}