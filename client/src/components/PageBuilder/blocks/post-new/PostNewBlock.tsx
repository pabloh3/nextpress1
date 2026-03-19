// blocks/post-new/PostNewBlock.tsx
import * as React from 'react';
import type { BlockDefinition, BlockComponentProps } from '../types.ts';
import type { BlockConfig, BlockContent } from '@shared/schema-types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { PlusSquare, PenLine, Settings, Wrench } from 'lucide-react';
import { getBlockStateAccessor } from '../blockStateRegistry';
import { useBlockState } from '../useBlockState';

// ============================================================================
// TYPES
// ============================================================================

export type PostNewContent = {
  buttonText?: string;
  style?: 'button' | 'card';
  description?: string;
  className?: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONTENT: PostNewContent = {
  buttonText: 'Create New Post',
  style: 'card',
  description: 'Share your thoughts with the world',
  className: '',
};

// ============================================================================
// UTILITIES
// ============================================================================

/** Build className string for the post-new wrapper. */
function buildWrapperClassName(content: PostNewContent): string {
  return ['wp-block-post-new', content?.className || '']
    .filter(Boolean)
    .join(' ');
}

// ============================================================================
// RENDERER
// ============================================================================

interface PostNewRendererProps {
  content: PostNewContent;
  styles?: React.CSSProperties;
  isPreview?: boolean;
}

/**
 * Pure presentational renderer for the new-post block.
 * "button" style: a simple styled button.
 * "card" style: a bordered card with icon, text, and description.
 * In preview mode the button/card is clickable (navigates to new post flow).
 * In editor mode the UI is non-interactive (visual preview only).
 */
function PostNewRenderer({ content, styles, isPreview }: PostNewRendererProps) {
  const buttonText = content?.buttonText || DEFAULT_CONTENT.buttonText!;
  const variant = content?.style || 'card';
  const description = content?.description || '';
  const className = buildWrapperClassName(content);

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      e.preventDefault();
      return;
    }
    // In preview, navigate to new post creation
    window.location.href = '/page-builder/new';
  };

  if (variant === 'button') {
    return (
      <div className={className} style={styles}>
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          style={isPreview ? undefined : { pointerEvents: 'none' }}>
          <PenLine className="h-4 w-4" />
          {buttonText}
        </button>
      </div>
    );
  }

  // Card variant
  return (
    <div className={className} style={styles}>
      <div
        onClick={handleClick}
        role={isPreview ? 'link' : undefined}
        tabIndex={isPreview ? 0 : undefined}
        className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-8 py-10 text-center transition-colors hover:border-primary/40 hover:bg-muted/50"
        style={isPreview ? { cursor: 'pointer' } : { pointerEvents: 'none' }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <PenLine className="h-6 w-6 text-primary" />
        </div>
        <span className="text-base font-medium text-foreground">
          {buttonText}
        </span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PostNewComponent({
  value,
  onChange,
  isPreview,
}: BlockComponentProps) {
  const { content, styles } = useBlockState<PostNewContent>({
    value,
    getDefaultContent: () => DEFAULT_CONTENT,
    onChange,
  });

  return (
    <PostNewRenderer content={content} styles={styles} isPreview={isPreview} />
  );
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface PostNewSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/**
 * Sidebar settings panel for the post-new block.
 * Controls button text, style variant, description text, and CSS classes.
 */
function PostNewSettings({ block, onUpdate }: PostNewSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const content = (block.content as PostNewContent) || DEFAULT_CONTENT;

  const updateContent = (updates: Partial<PostNewContent>) => {
    const updated = { ...content, ...updates };
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

  const currentStyle = content?.style || 'card';

  return (
    <div className="space-y-4">
      {/* Content Settings */}
      <CollapsibleCard title="Content" icon={Settings} defaultOpen>
        <div className="space-y-4">
          {/* Button Text */}
          <div>
            <Label
              htmlFor="post-new-text"
              className="text-sm font-medium text-gray-700">
              Button Text
            </Label>
            <Input
              id="post-new-text"
              value={content?.buttonText || ''}
              onChange={(e) => updateContent({ buttonText: e.target.value })}
              placeholder="Create New Post"
              className="mt-1 h-9 text-sm"
            />
          </div>

          {/* Style Select */}
          <div>
            <Label
              htmlFor="post-new-style"
              className="text-sm font-medium text-gray-700">
              Style
            </Label>
            <Select
              value={currentStyle}
              onValueChange={(val: 'button' | 'card') =>
                updateContent({ style: val })
              }>
              <SelectTrigger id="post-new-style" className="mt-1 h-9 text-sm">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="button">Button</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label
              htmlFor="post-new-desc"
              className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="post-new-desc"
              value={content?.description || ''}
              onChange={(e) => updateContent({ description: e.target.value })}
              placeholder="Sub-text shown below the button"
              rows={2}
              className="mt-1 resize-y text-sm"
            />
          </div>
        </div>
      </CollapsibleCard>

      {/* Advanced / CSS Class */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div>
          <Label
            htmlFor="post-new-class"
            className="text-sm font-medium text-gray-700">
            Additional CSS Class(es)
          </Label>
          <Input
            id="post-new-class"
            value={content?.className || ''}
            onChange={(e) => updateContent({ className: e.target.value })}
            placeholder="e.g. custom-new-post"
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

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

/**
 * Post New block definition for the PageBuilder.
 * Renders a "Create New Post" button or card. In preview mode, clicking it
 * navigates to the new-post creation flow. In the editor it shows a
 * non-interactive visual preview.
 */
const PostNewBlock: BlockDefinition = {
  id: 'post/new',
  label: 'New Post',
  icon: PlusSquare,
  description: 'Display a button or card to create a new post',
  category: 'post',
  defaultContent: DEFAULT_CONTENT,
  defaultStyles: { margin: '0 0 1em 0' },
  component: PostNewComponent,
  settings: PostNewSettings,
  hasSettings: true,
};

export default PostNewBlock;
