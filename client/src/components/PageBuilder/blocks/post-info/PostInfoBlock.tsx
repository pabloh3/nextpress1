// blocks/post-info/PostInfoBlock.tsx
import { useState, useEffect } from 'react';
import * as React from 'react';
import type { BlockDefinition, BlockComponentProps } from '../types.ts';
import type { BlockConfig, BlockContent } from '@shared/schema-types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import {
  Info,
  Calendar,
  Folder,
  Tag,
  Clock,
  Settings,
  Wrench,
} from 'lucide-react';
import { getBlockStateAccessor } from '../blockStateRegistry';
import { useBlockState } from '../useBlockState';

// ============================================================================
// TYPES
// ============================================================================

export type PostInfoContent = {
  postId?: string;
  showDate?: boolean;
  showCategories?: boolean;
  showTags?: boolean;
  showReadTime?: boolean;
  dateFormat?: 'short' | 'long' | 'relative';
  layout?: 'inline' | 'stacked';
  className?: string;
};

type PostMeta = {
  publishedAt?: string;
  categories?: string[];
  tags?: string[];
  wordCount?: number;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONTENT: PostInfoContent = {
  postId: '',
  showDate: true,
  showCategories: true,
  showTags: true,
  showReadTime: true,
  dateFormat: 'long',
  layout: 'inline',
  className: '',
};

const PLACEHOLDER_META: PostMeta = {
  publishedAt: '2025-01-15T00:00:00Z',
  categories: ['Technology', 'Design'],
  tags: ['react', 'nextpress', 'cms'],
  wordCount: 1000,
};

const WORDS_PER_MINUTE = 200;

const DATE_FORMAT_OPTIONS = [
  { value: 'short' as const, label: 'Short (Jan 15, 2025)' },
  { value: 'long' as const, label: 'Long (January 15, 2025)' },
  { value: 'relative' as const, label: 'Relative (3 days ago)' },
] as const;

const LAYOUT_OPTIONS = [
  { value: 'inline' as const, label: 'Inline' },
  { value: 'stacked' as const, label: 'Stacked' },
] as const;

// ============================================================================
// HELPERS
// ============================================================================

/** Compute a human-readable relative time string from a date. */
function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffDays >= 365)
    return `${Math.floor(diffDays / 365)} year${diffDays >= 730 ? 's' : ''} ago`;
  if (diffDays >= 30)
    return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? 's' : ''} ago`;
  if (diffDays >= 7)
    return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0)
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

/** Format a date string according to the specified format. */
function formatDate(
  isoDate: string,
  format: 'short' | 'long' | 'relative',
): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return 'Invalid date';
  if (format === 'relative') return formatRelativeTime(date);
  const month = format === 'short' ? 'short' : 'long';
  return date.toLocaleDateString('en-US', {
    month,
    day: 'numeric',
    year: 'numeric',
  });
}

/** Estimate read time from word count (~200 words/min). */
function computeReadTime(wordCount: number | undefined): string {
  if (!wordCount || wordCount <= 0) return '1 min read';
  return `${Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))} min read`;
}

/** Fetch post metadata from the API. Returns null while loading or on failure. */
function usePostMeta(
  postId: string | undefined,
  isPreview: boolean,
): PostMeta | null {
  const [meta, setMeta] = useState<PostMeta | null>(null);
  useEffect(() => {
    if (!isPreview || !postId) {
      setMeta(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/posts/${postId}`)
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => {
        if (!cancelled)
          setMeta({
            publishedAt: data.publishedAt,
            categories: data.categories,
            tags: data.tags,
            wordCount: data.wordCount,
          });
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [postId, isPreview]);
  return meta;
}

/** Build the wrapper className string. */
function buildClassName(
  content: PostInfoContent,
  layout: 'inline' | 'stacked',
): string {
  return [
    'wp-block-post-info',
    layout === 'stacked' ? 'post-info--stacked' : 'post-info--inline',
    content?.className || '',
  ]
    .filter(Boolean)
    .join(' ');
}

// ============================================================================
// RENDERER
// ============================================================================

interface PostInfoRendererProps {
  content: PostInfoContent;
  styles?: React.CSSProperties;
  isPreview?: boolean;
}

/** Renders a small pill/badge for categories and tags. */
function CategoryBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}

/**
 * Pure presentational renderer for the post info block.
 * Preview mode fetches real data; editor mode shows placeholders.
 */
function PostInfoRenderer({
  content,
  styles,
  isPreview,
}: PostInfoRendererProps) {
  const layout = content?.layout ?? 'inline';
  const dateFormat = content?.dateFormat ?? 'long';
  const className = buildClassName(content, layout);
  const fetched = usePostMeta(content?.postId, !!isPreview);
  const meta: PostMeta = isPreview && fetched ? fetched : PLACEHOLDER_META;
  const items: React.ReactNode[] = [];

  if ((content?.showDate ?? true) && meta.publishedAt) {
    items.push(
      <span
        key="date"
        className="flex items-center gap-1.5 text-sm text-gray-600">
        <Calendar className="h-3.5 w-3.5" />
        {formatDate(meta.publishedAt, dateFormat)}
      </span>,
    );
  }
  if ((content?.showCategories ?? true) && meta.categories?.length) {
    items.push(
      <span
        key="categories"
        className="flex items-center gap-1.5 text-sm text-gray-600">
        <Folder className="h-3.5 w-3.5" />
        <span className="flex flex-wrap gap-1">
          {meta.categories.map((cat) => (
            <CategoryBadge key={cat}>{cat}</CategoryBadge>
          ))}
        </span>
      </span>,
    );
  }
  if ((content?.showTags ?? true) && meta.tags?.length) {
    items.push(
      <span
        key="tags"
        className="flex items-center gap-1.5 text-sm text-gray-600">
        <Tag className="h-3.5 w-3.5" />
        <span className="flex flex-wrap gap-1">
          {meta.tags.map((tag) => (
            <CategoryBadge key={tag}>{tag}</CategoryBadge>
          ))}
        </span>
      </span>,
    );
  }
  if (content?.showReadTime ?? true) {
    items.push(
      <span
        key="readtime"
        className="flex items-center gap-1.5 text-sm text-gray-600">
        <Clock className="h-3.5 w-3.5" />
        {computeReadTime(meta.wordCount)}
      </span>,
    );
  }

  if (items.length === 0) {
    return (
      <div className={className} style={styles}>
        <p className="text-sm text-gray-400 italic">
          No post info items enabled
        </p>
      </div>
    );
  }

  if (layout === 'inline') {
    return (
      <div className={className} style={styles}>
        <div className="flex flex-wrap items-center gap-3">
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-gray-300">·</span>}
              {item}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={styles}>
      <div className="flex flex-col gap-2">{items}</div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PostInfoBlockComponent({
  value,
  onChange,
  isPreview,
}: BlockComponentProps) {
  const { content, styles } = useBlockState<PostInfoContent>({
    value,
    getDefaultContent: () => DEFAULT_CONTENT,
    onChange,
  });
  return (
    <PostInfoRenderer content={content} styles={styles} isPreview={isPreview} />
  );
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface PostInfoSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/** Sidebar settings panel for the post info block. */
function PostInfoSettings({ block, onUpdate }: PostInfoSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [localContent, setLocalContent] = React.useState<PostInfoContent>(
    (block.content as PostInfoContent) || DEFAULT_CONTENT,
  );

  React.useEffect(() => {
    setLocalContent((block.content as PostInfoContent) || DEFAULT_CONTENT);
  }, [block.content]);

  const updateContent = (updates: Partial<PostInfoContent>) => {
    const updated = { ...localContent, ...updates };
    setLocalContent(updated);
    if (accessor) {
      accessor.setContent(updated);
    } else if (onUpdate) {
      onUpdate({
        content: { ...updated } as unknown as BlockContent,
      });
    }
  };

  const toggles = [
    {
      id: 'show-date',
      label: 'Show Date',
      key: 'showDate' as const,
      value: localContent?.showDate ?? true,
    },
    {
      id: 'show-categories',
      label: 'Show Categories',
      key: 'showCategories' as const,
      value: localContent?.showCategories ?? true,
    },
    {
      id: 'show-tags',
      label: 'Show Tags',
      key: 'showTags' as const,
      value: localContent?.showTags ?? true,
    },
    {
      id: 'show-readtime',
      label: 'Show Read Time',
      key: 'showReadTime' as const,
      value: localContent?.showReadTime ?? true,
    },
  ];

  return (
    <div className="space-y-4">
      <CollapsibleCard title="Display" icon={Settings} defaultOpen>
        <div className="space-y-4">
          {toggles.map((toggle) => (
            <div key={toggle.id} className="flex items-center justify-between">
              <Label
                htmlFor={toggle.id}
                className="text-sm font-medium text-gray-700">
                {toggle.label}
              </Label>
              <Switch
                id={toggle.id}
                checked={toggle.value}
                onCheckedChange={(checked) =>
                  updateContent({ [toggle.key]: checked })
                }
              />
            </div>
          ))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Format" icon={Settings} defaultOpen>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Date Format
            </Label>
            <Select
              value={localContent?.dateFormat ?? 'long'}
              onValueChange={(val) =>
                updateContent({
                  dateFormat: val as PostInfoContent['dateFormat'],
                })
              }>
              <SelectTrigger className="mt-1 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Layout</Label>
            <Select
              value={localContent?.layout ?? 'inline'}
              onValueChange={(val) =>
                updateContent({ layout: val as PostInfoContent['layout'] })
              }>
              <SelectTrigger className="mt-1 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYOUT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Label
            htmlFor="post-info-class"
            className="text-sm font-medium text-gray-700">
            Additional CSS Class(es)
          </Label>
          <Input
            id="post-info-class"
            value={localContent?.className || ''}
            onChange={(e) => updateContent({ className: e.target.value })}
            placeholder="e.g. custom-post-info"
            className="mt-1 h-9 text-sm"
          />
        </div>
      </CollapsibleCard>
    </div>
  );
}

// ============================================================================
// LEGACY RENDERER
// ============================================================================

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

/**
 * Post Info block definition for the PageBuilder.
 * Displays post metadata: date, categories, tags, and estimated read time.
 */
const PostInfoBlock: BlockDefinition = {
  id: 'post/info',
  label: 'Post Info',
  icon: Info,
  description: 'Display post metadata: date, categories, tags, and read time',
  category: 'post',
  defaultContent: DEFAULT_CONTENT,
  defaultStyles: { margin: '0.5em 0' },
  component: PostInfoBlockComponent,
  settings: PostInfoSettings,
  hasSettings: true,
};

export default PostInfoBlock;
