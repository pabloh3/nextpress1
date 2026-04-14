import React from 'react';
import type { BlockConfig, BlockContent } from '@shared/schema-types';
import type { BlockDefinition, BlockComponentProps } from '../types.ts';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { Smile, Link as LinkIcon, Type, ExternalLink } from 'lucide-react';
import { getBlockStateAccessor } from '../blockStateRegistry';
import { useBlockState } from '../useBlockState';
import { IconRenderer } from '../shared/IconRenderer';
import { IconPickerButton } from '../../IconPicker/IconPickerButton';
import type { IconReference } from '@/lib/icon-indexes';

// ============================================================================
// TYPES
// ============================================================================
const DEFAULT_ICON: IconReference = {
  iconSet: 'lucide',
  iconName: 'star',
  size: 24,
  color: 'currentColor',
  strokeWidth: 2,
};

type IconContent = {
  icon: IconReference;
  link: string;
  linkTarget: '_self' | '_blank';
  label: string;
};

const DEFAULT_CONTENT: IconContent = {
  icon: { ...DEFAULT_ICON },
  link: '',
  linkTarget: '_self',
  label: '',
};

// ============================================================================
// RENDERER
// ============================================================================

interface IconRendererBlockProps {
  content: IconContent;
  styles?: React.CSSProperties;
  isPreview?: boolean;
}

function IconBlockRenderer({ content, styles, isPreview }: IconRendererBlockProps) {
  const icon = content?.icon || DEFAULT_ICON;
  const link = content?.link;
  const linkTarget = content?.linkTarget || '_self';
  const label = content?.label;

  const iconElement = (
    <IconRenderer
      icon={icon}
      className="wp-block-icon"
      style={{
        ...styles,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label={label || undefined}
    />
  );

  if (link && link !== '#' && !isPreview) {
    return (
      <a
        href={link}
        target={linkTarget}
        rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
        title={label || undefined}
        style={{ textDecoration: 'none' }}
      >
        {iconElement}
      </a>
    );
  }

  return iconElement;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function IconBlockComponent({
  value,
  onChange,
  isPreview,
}: BlockComponentProps) {
  const { content, styles } = useBlockState<IconContent>({
    value,
    getDefaultContent: () => ({ ...DEFAULT_CONTENT, icon: { ...DEFAULT_ICON } }),
    onChange,
  });

  return <IconBlockRenderer content={content} styles={styles} isPreview={isPreview} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface IconSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function IconSettings({ block, onUpdate }: IconSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  const content = accessor
    ? (accessor.getContent() as unknown as IconContent)
    : (block.content as unknown as IconContent) || DEFAULT_CONTENT;

  const currentIcon: IconReference = content?.icon || DEFAULT_ICON;

  const updateContent = (updates: Partial<IconContent>) => {
    if (accessor) {
      const current = accessor.getContent() as unknown as IconContent;
      accessor.setContent({ ...current, ...updates });
      setUpdateTrigger((prev) => prev + 1);
    } else if (onUpdate) {
      onUpdate({
        content: {
          ...block.content,
          ...updates,
        } as BlockContent,
      });
    }
  };

  const handleIconSelect = (icon: IconReference) => {
    updateContent({ icon });
  };

  return (
    <div className="space-y-4">
      <CollapsibleCard title="Icon" icon={Smile} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Selected Icon</Label>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 bg-gray-50">
                <IconRenderer icon={currentIcon} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 truncate">
                  {currentIcon.iconSet} / {currentIcon.iconName}
                </p>
              </div>
              <IconPickerButton
                currentIcon={currentIcon}
                onSelect={handleIconSelect}
              />
            </div>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Appearance" icon={Type} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="icon-size" className="text-sm font-medium text-gray-700">
              Size (px)
            </Label>
            <Input
              id="icon-size"
              type="number"
              value={currentIcon.size || 24}
              onChange={(e) =>
                updateContent({
                  icon: { ...currentIcon, size: Number(e.target.value) || 24 },
                })
              }
              min={8}
              max={200}
              className="mt-1 h-9"
            />
          </div>

          <div>
            <Label htmlFor="icon-color" className="text-sm font-medium text-gray-700">
              Color
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="icon-color"
                type="color"
                value={currentIcon.color || '#000000'}
                onChange={(e) =>
                  updateContent({
                    icon: { ...currentIcon, color: e.target.value },
                  })
                }
                className="w-12 h-9 p-1 border-gray-200"
              />
              <Input
                value={currentIcon.color || 'currentColor'}
                onChange={(e) =>
                  updateContent({
                    icon: { ...currentIcon, color: e.target.value },
                  })
                }
                placeholder="currentColor"
                className="flex-1 h-9 text-sm"
              />
            </div>
          </div>

          {currentIcon.iconSet === 'lucide' && (
            <div>
              <Label htmlFor="icon-stroke" className="text-sm font-medium text-gray-700">
                Stroke Width
              </Label>
              <Input
                id="icon-stroke"
                type="number"
                value={currentIcon.strokeWidth || 2}
                onChange={(e) =>
                  updateContent({
                    icon: { ...currentIcon, strokeWidth: Number(e.target.value) || 2 },
                  })
                }
                min={0.5}
                max={4}
                step={0.5}
                className="mt-1 h-9"
              />
            </div>
          )}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Link" icon={LinkIcon} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="icon-link" className="text-sm font-medium text-gray-700">
              Link URL
            </Label>
            <Input
              id="icon-link"
              value={content?.link || ''}
              onChange={(e) => updateContent({ link: e.target.value })}
              placeholder="https://example.com"
              className="mt-1 h-9"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Link Target</Label>
            <div className="flex gap-2 mt-1">
              {[
                { value: '_self' as const, label: 'Same Window' },
                { value: '_blank' as const, label: 'New Window', icon: ExternalLink },
              ].map((target) => (
                <button
                  key={target.value}
                  onClick={() => updateContent({ linkTarget: target.value })}
                  className={`h-8 px-3 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                    (content?.linkTarget || '_self') === target.value
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {target.icon && <target.icon className="w-3 h-3" />}
                  {target.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="icon-label" className="text-sm font-medium text-gray-700">
              Accessible Label
            </Label>
            <Input
              id="icon-label"
              value={content?.label || ''}
              onChange={(e) => updateContent({ label: e.target.value })}
              placeholder="Describe this icon for screen readers"
              className="mt-1 h-9"
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const IconBlock: BlockDefinition = {
  id: 'core/icon',
  label: 'Icon',
  icon: Smile,
  description: 'Add an icon from various icon sets',
  category: 'basic',
  defaultContent: {
    icon: { ...DEFAULT_ICON },
    link: '',
    linkTarget: '_self',
    label: '',
  },
  defaultStyles: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  component: IconBlockComponent,
  settings: IconSettings,
  hasSettings: true,
};

export default IconBlock;
