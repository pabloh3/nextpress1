import { useState, useEffect } from 'react';
import * as React from 'react';
import { useBlockState } from '../useBlockState';
import { getBlockStateAccessor } from '../blockStateRegistry';
import type { BlockDefinition, BlockComponentProps } from '../types';
import type { BlockConfig, BlockContent } from '@shared/schema-types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { MessageSquare, Settings, Wrench } from 'lucide-react';

// --- Types ---

export type PostCommentsContent = {
  postId?: string;
  showForm?: boolean;
  showCount?: boolean;
  commentsPerPage?: number;
  allowReplies?: boolean;
  className?: string;
};

type CommentItem = {
  id: number;
  author: string;
  email?: string;
  date: string;
  content: string;
  replies?: CommentItem[];
};

const DEFAULT_CONTENT: PostCommentsContent = {
  postId: '',
  showForm: true,
  showCount: true,
  commentsPerPage: 10,
  allowReplies: true,
  className: '',
};

// --- Helpers ---

/** Generates placeholder comments for the editor preview. */
function buildPlaceholderComments(): CommentItem[] {
  return [
    {
      id: 1,
      author: 'Jane Doe',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      content:
        'Great article! I really enjoyed reading this. The points you made about architecture were spot on.',
      replies: [
        {
          id: 4,
          author: 'Author',
          date: new Date(Date.now() - 86400000).toISOString(),
          content: 'Thank you, Jane! Glad you found it useful.',
        },
      ],
    },
    {
      id: 2,
      author: 'John Smith',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      content:
        'Very insightful. Would love to see a follow-up post diving deeper into the topic.',
    },
    {
      id: 3,
      author: 'Alice Lee',
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      content: 'Thanks for sharing this. Bookmarked for future reference!',
    },
  ];
}

/** Formats an ISO date string to a human-readable locale date. */
function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Generates initials from an author name for the avatar circle. */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// --- Comment Entry ---

/** Renders a single comment with avatar, metadata, content, and optional nested replies. */
function CommentEntry({
  comment,
  allowReplies,
  depth = 0,
}: {
  comment: CommentItem;
  allowReplies: boolean;
  depth?: number;
}) {
  const hasReplies =
    allowReplies && comment.replies && comment.replies.length > 0;

  return (
    <div className={depth > 0 ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}>
      <div className="flex items-start gap-3 py-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-gray-600">
            {getInitials(comment.author)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800">
              {comment.author}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(comment.date)}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {comment.content}
          </p>
        </div>
      </div>
      {hasReplies &&
        comment.replies!.map((reply) => (
          <CommentEntry
            key={reply.id}
            comment={reply}
            allowReplies={allowReplies}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

// --- Comment Form ---

/** Renders the "Leave a Comment" form with name, email, and comment fields. */
function CommentForm({ isPreview }: { isPreview?: boolean }) {
  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        Leave a Comment
      </h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Name *"
            className="h-9 text-sm"
            disabled={!isPreview}
          />
          <Input
            placeholder="Email *"
            type="email"
            className="h-9 text-sm"
            disabled={!isPreview}
          />
        </div>
        <Textarea
          placeholder="Write your comment..."
          rows={4}
          className="text-sm resize-y"
          disabled={!isPreview}
        />
        <Button size="sm" disabled={!isPreview}>
          Post Comment
        </Button>
      </div>
    </div>
  );
}

// --- Renderer ---

/**
 * Renders the comments section.
 * Preview mode fetches real comments from the API; editor mode shows placeholders.
 */
function PostCommentsRenderer({
  content,
  styles,
  isPreview,
}: {
  content: PostCommentsContent;
  styles?: React.CSSProperties;
  isPreview?: boolean;
}) {
  const cfg = {
    ...DEFAULT_CONTENT,
    ...content,
  } as Required<PostCommentsContent>;
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPreview) {
      setComments(buildPlaceholderComments());
      return;
    }
    if (!cfg.postId) {
      setComments([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      postId: cfg.postId,
      per_page: String(cfg.commentsPerPage),
    });

    fetch(`/api/comments?${params.toString()}`)
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to fetch comments (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const items: CommentItem[] = (
          Array.isArray(data) ? data : (data.comments ?? [])
        ).map((c: any) => ({
          id: c.id,
          author: c.author ?? c.authorName ?? 'Anonymous',
          date: c.date ?? c.createdAt ?? c.created_at ?? '',
          content: c.content ?? c.body ?? '',
          replies: Array.isArray(c.replies)
            ? c.replies.map((r: any) => ({
                id: r.id,
                author: r.author ?? r.authorName ?? 'Anonymous',
                date: r.date ?? r.createdAt ?? r.created_at ?? '',
                content: r.content ?? r.body ?? '',
              }))
            : [],
        }));
        setComments(items);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isPreview, cfg.postId, cfg.commentsPerPage]);

  const wrapperClass = ['np-post-comments', cfg.className]
    .filter(Boolean)
    .join(' ');

  if (loading)
    return (
      <div className={wrapperClass} style={styles}>
        <p className="text-sm text-gray-400 py-8 text-center">
          Loading comments…
        </p>
      </div>
    );
  if (error)
    return (
      <div className={wrapperClass} style={styles}>
        <p className="text-sm text-red-400 py-8 text-center">{error}</p>
      </div>
    );

  return (
    <div className={wrapperClass} style={styles}>
      {cfg.showCount && (
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h2>
      )}
      {comments.length === 0 && !cfg.showForm && (
        <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded">
          <MessageSquare className="w-10 h-10 mx-auto mb-2" />
          <p>No comments yet</p>
        </div>
      )}
      {comments.length > 0 && (
        <div className="divide-y divide-gray-100">
          {comments.map((comment) => (
            <CommentEntry
              key={comment.id}
              comment={comment}
              allowReplies={cfg.allowReplies}
            />
          ))}
        </div>
      )}
      {cfg.showForm && <CommentForm isPreview={isPreview} />}
    </div>
  );
}

// --- Main Component ---

export function PostCommentsBlockComponent({
  value,
  onChange,
  isPreview,
}: BlockComponentProps) {
  const { content, styles } = useBlockState<PostCommentsContent>({
    value,
    getDefaultContent: () => DEFAULT_CONTENT,
    onChange,
  });
  return (
    <PostCommentsRenderer
      content={content}
      styles={styles}
      isPreview={isPreview}
    />
  );
}

// --- Settings ---

/** Sidebar settings panel for the post comments block. */
function PostCommentsSettings({
  block,
  onUpdate,
}: {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}) {
  const accessor = getBlockStateAccessor(block.id);
  const [localContent, setLocalContent] = React.useState<PostCommentsContent>(
    (block.content as PostCommentsContent) || DEFAULT_CONTENT,
  );

  React.useEffect(() => {
    setLocalContent((block.content as PostCommentsContent) || DEFAULT_CONTENT);
  }, [block.content]);

  const updateContent = (updates: Partial<PostCommentsContent>) => {
    const updated = { ...localContent, ...updates };
    setLocalContent(updated);
    if (accessor) {
      accessor.setContent(updated);
    } else if (onUpdate) {
      onUpdate({ content: { ...updated } as BlockContent });
    }
  };

  return (
    <div className="space-y-4">
      <CollapsibleCard title="Display" icon={Settings} defaultOpen>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="pc-show-form">Show comment form</Label>
            <Switch
              id="pc-show-form"
              checked={localContent.showForm ?? true}
              onCheckedChange={(v) => updateContent({ showForm: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pc-show-count">Show comment count</Label>
            <Switch
              id="pc-show-count"
              checked={localContent.showCount ?? true}
              onCheckedChange={(v) => updateContent({ showCount: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pc-allow-replies">Allow replies</Label>
            <Switch
              id="pc-allow-replies"
              checked={localContent.allowReplies ?? true}
              onCheckedChange={(v) => updateContent({ allowReplies: v })}
            />
          </div>
          <div>
            <Label htmlFor="pc-per-page">Comments per page</Label>
            <Input
              id="pc-per-page"
              type="number"
              min={1}
              max={100}
              className="h-9"
              value={localContent.commentsPerPage ?? 10}
              onChange={(e) =>
                updateContent({
                  commentsPerPage: Math.max(1, Number(e.target.value) || 1),
                })
              }
            />
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Post" icon={Settings} defaultOpen={false}>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Post ID</Label>
          {localContent?.postId ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs truncate">
                {localContent.postId}
              </Badge>
              <button
                onClick={() => updateContent({ postId: '' })}
                className="text-xs text-gray-400 hover:text-red-500">
                clear
              </button>
            </div>
          ) : (
            <Input
              value={localContent?.postId || ''}
              onChange={(e) => updateContent({ postId: e.target.value })}
              placeholder="Auto-set when added to a post"
              className="h-9 text-sm"
            />
          )}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div>
          <Label htmlFor="pc-class">Additional CSS Class(es)</Label>
          <Input
            id="pc-class"
            className="h-9 text-sm"
            value={localContent.className ?? ''}
            onChange={(e) => updateContent({ className: e.target.value })}
            placeholder="e.g. custom-comments"
          />
        </div>
      </CollapsibleCard>
    </div>
  );
}

// --- Legacy Renderer ---

function LegacyPostCommentsRenderer({
  block,
  isPreview,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  const raw = block.content as any;
  const content: PostCommentsContent =
    raw?.kind === 'structured'
      ? (raw.data as PostCommentsContent)
      : ((raw as PostCommentsContent) ?? DEFAULT_CONTENT);
  return (
    <PostCommentsRenderer
      content={content}
      styles={block.styles}
      isPreview={isPreview}
    />
  );
}

// --- Block Definition ---

/**
 * Post Comments block for the PageBuilder.
 * Displays a comment list and submission form. Editor mode shows placeholders;
 * preview mode fetches real comments from the API.
 */
const PostCommentsBlock: BlockDefinition = {
  id: 'post/comments',
  label: 'Post Comments',
  icon: MessageSquare,
  description: 'Display post comments and a comment submission form',
  category: 'post',
  defaultContent: DEFAULT_CONTENT,
  defaultStyles: {},
  component: PostCommentsBlockComponent,
  renderer: LegacyPostCommentsRenderer,
  settings: PostCommentsSettings,
  hasSettings: true,
};

export default PostCommentsBlock;
