'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart } from 'lucide-react';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Comment {
  comment_id: string;
  content: string;
  created_at: string;
  upvotes: number;
  hasUpvoted?: boolean;
  author: {
    username: string | null;
    display_name: string | null;
  };
}

export default function CommentsSection({ storyId }: { storyId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stories/${encodeURIComponent(storyId)}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  const handlePost = async () => {
    if (!input.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/stories/${encodeURIComponent(storyId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setInput('');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to post comment');
      }
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    const res = await fetch(`/api/comments/${encodeURIComponent(commentId)}/like`, { method: 'POST' });
    if (res.ok) {
      const { liked, upvotes } = await res.json();
      setComments((prev) =>
        prev.map((c) => (c.comment_id === commentId ? { ...c, hasUpvoted: liked, upvotes } : c))
      );
    }
  };

  const commentsCount = comments.length;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="comments">
        <AccordionTrigger>
          {loading ? 'Loading comments…' : `${commentsCount} Comment${commentsCount === 1 ? '' : 's'}`}
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          {/* Comment composer */}
          <div className="flex items-start gap-2">
            <Input
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= 70) setInput(e.target.value);
              }}
              placeholder="Add a comment… (70 chars max)"
              className="flex-1"
              disabled={posting}
            />
            <Button size="sm" onClick={handlePost} disabled={posting || !input.trim()}>
              Post
            </Button>
          </div>

          {/* Comments list */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.comment_id} className="flex items-start gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>
                    {c.author.display_name?.[0]?.toUpperCase() || c.author.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">
                      {c.author.display_name || c.author.username}
                    </span>
                    <span className="text-muted-foreground">@{c.author.username}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm break-words whitespace-pre-wrap">{c.content}</p>
                </div>
                <button
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-red-500"
                  onClick={() => toggleLike(c.comment_id)}
                >
                  <Heart className={`w-3 h-3 ${c.hasUpvoted ? 'fill-current text-red-500' : ''}`} />
                  <span>{c.upvotes}</span>
                </button>
              </div>
            ))}
            {!loading && comments.length === 0 && (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
} 