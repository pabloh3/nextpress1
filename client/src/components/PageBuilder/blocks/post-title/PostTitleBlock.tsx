import * as React from 'react';
import type { BlockDefinition, BlockComponentProps } from '../types.ts';
import type { BlockConfig, BlockContent } from '@shared/schema-types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { Type, Settings, Wrench } from 'lucide-react';
import { getBlockStateAccessor } from '../blockStateRegistry';
import { useBlockState } from '../useBlockState';

// ============================================================================
// TYPES
// ============================================================================

export type PostTitleContent = {
  text?: string;
  tag?: 'h1' | 'h2' | 'h3';
  className?: string;
};

const DEFAULT_CONTENT: PostTitleContent = {
  text: 'Post Title',
  tag: 'h1',
  className: '',
};

const HEADING_TAG_OPTIONS = [
  { value: 'h1' as const, label: 'H1' },
  { value: 'h2' as const, label: 'H2' },
  { value: 'h3' as const, label: 'H3' },
] as const;

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Build className string for the post title element.
 */
function buildTitleClassName(content: PostTitleContent): string {
  return ['wp-block-post-title', content?.className || '']
    .filter(Boolean)
    .join(' ');
}

/**
 * Get button className for tag-level toggle buttons.
 */
function getTagButtonClassName(isActive: boolean): string {
  const base = 'h-9 px-3 text-sm font-semibold rounded-md transition-all';
  const active = 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  const inactive =
    'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300';
  return `${base} ${isActive ? active : inactive}`;
}

// ============================================================================
// RENDERER
// ============================================================================

interface PostTitleRendererProps {
  content: PostTitleContent;
  styles?: React.CSSProperties;
}

/**
 * Pure presentational renderer for the post title.
 * Renders a static heading element in both editor and preview mode.
 * Content is edited via the sidebar settings panel.
 */
function PostTitleRenderer({ content, styles }: PostTitleRendererProps) {
  const text = content?.text || 'Post Title';
  const tag = content?.tag || 'h1';
  const className = buildTitleClassName(content);

  return React.createElement(tag, { className, style: styles }, text);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PostTitleComponent({ value, onChange }: BlockComponentProps) {
  const { content, styles } = useBlockState<PostTitleContent>({
    value,
    getDefaultContent: () => DEFAULT_CONTENT,
    onChange,
  });

  return <PostTitleRenderer content={content} styles={styles} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface PostTitleSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/**
 * Sidebar settings panel for the post title block.
 * Allows choosing the heading tag level (h1-h3) and adding custom CSS classes.
 */
function PostTitleSettings({ block, onUpdate }: PostTitleSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [localContent, setLocalContent] = React.useState<PostTitleContent>(
    (block.content as PostTitleContent) || DEFAULT_CONTENT,
  );

  React.useEffect(() => {
    setLocalContent((block.content as PostTitleContent) || DEFAULT_CONTENT);
  }, [block.content]);

  const updateContent = (updates: Partial<PostTitleContent>) => {
    const updated = { ...localContent, ...updates };
    setLocalContent(updated);
    if (accessor) {
      accessor.setContent(updated);
    } else if (onUpdate) {
      onUpdate({
        content: {
          ...updated,
        } as unknown as BlockContent,
      });
    }
  };

  const currentTag = localContent?.tag || 'h1';

  return (
    <div className="space-y-4">
      {/* Content */}
      <CollapsibleCard title="Content" icon={Type} defaultOpen>
        <div>
          <Label
            htmlFor="post-title-text"
            className="text-sm font-medium text-gray-700">
            Title Text
          </Label>
          <Input
            id="post-title-text"
            value={localContent?.text || ''}
            onChange={(e) => updateContent({ text: e.target.value })}
            placeholder="Enter post title"
            className="mt-1 h-9 text-sm"
          />
        </div>
      </CollapsibleCard>

      {/* Heading Tag Level */}
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen>
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Heading Level
          </Label>
          <div className="flex flex-wrap gap-2">
            {HEADING_TAG_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateContent({ tag: option.value })}
                className={getTagButtonClassName(currentTag === option.value)}
                aria-label={`Use ${option.label} tag`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </CollapsibleCard>

      {/* Advanced / CSS Class */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div>
          <Label
            htmlFor="post-title-class"
            className="text-sm font-medium text-gray-700">
            Additional CSS Class(es)
          </Label>
          <Input
            id="post-title-class"
            value={localContent?.className || ''}
            onChange={(e) => updateContent({ className: e.target.value })}
            placeholder="e.g. custom-title"
            className="mt-1 h-9 text-sm"
          />
        </div>
      </CollapsibleCard>
    </div>
  );
}

// ============================================================================
// LEGACY RENDERER (Backward Compatibility)
// ============================================================================

function LegacyPostTitleRenderer({
  block,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <PostTitleRenderer
      content={(block.content as PostTitleContent) || DEFAULT_CONTENT}
      styles={block.styles}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

/**
 * Post Title block definition for the PageBuilder.
 * Renders the post title as a configurable heading element (h1/h2/h3).
 * In editor mode the title is inline-editable; in preview mode it renders
 * as a static heading.
 */
const PostTitleBlock: BlockDefinition = {
  id: 'post/title',
  label: 'Post Title',
  icon: Type,
  description: 'Display the post title as a heading',
  category: 'post',
  defaultContent: DEFAULT_CONTENT,
  defaultStyles: { margin: '0 0 1em 0' },
  component: PostTitleComponent,
  renderer: LegacyPostTitleRenderer,
  settings: PostTitleSettings,
  hasSettings: true,
};

export default PostTitleBlock;
