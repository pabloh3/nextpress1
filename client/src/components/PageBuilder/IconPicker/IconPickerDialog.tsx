import React, { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { IconReference } from '@/lib/icon-indexes';
import { LUCIDE_ICONS } from '@/lib/icon-indexes/lucide';
import { REACT_ICONS_SETS } from '@/lib/icon-indexes/react-icons';
import { SVGL_ICONS } from '@/lib/icon-indexes/svgl';
import { IconRenderer } from '../blocks/shared/IconRenderer';

// ============================================================================
// CONSTANTS
// ============================================================================

const PAGE_SIZE = 60;

interface IconSetOption {
  id: string;
  label: string;
  storageKey: string;
  iconSet: 'lucide' | 'react-icons' | 'svgl';
  prefix?: string;
  names: string[];
}

const ICON_SET_OPTIONS: IconSetOption[] = [
  {
    id: 'lucide',
    label: 'Lucide',
    storageKey: 'lucide',
    iconSet: 'lucide',
    names: LUCIDE_ICONS,
  },
  ...Object.entries(REACT_ICONS_SETS).map(([prefix, names]) => ({
    id: `react-icons:${prefix}`,
    label: `react-icons / ${prefix}`,
    storageKey: `react-icons:${prefix}`,
    iconSet: 'react-icons' as const,
    prefix,
    names,
  })),
  {
    id: 'svgl',
    label: 'Brands (SVGL)',
    storageKey: 'svgl',
    iconSet: 'svgl',
    names: SVGL_ICONS,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface IconPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (icon: IconReference) => void;
  currentIcon?: IconReference;
}

export function IconPickerDialog({
  open,
  onOpenChange,
  onSelect,
  currentIcon,
}: IconPickerDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedSet, setSelectedSet] = useState<string>(
    currentIcon ? getStorageKey(currentIcon) : 'lucide'
  );
  const [page, setPage] = useState(0);

  // Find active set
  const activeSet = useMemo(
    () => ICON_SET_OPTIONS.find((s) => s.storageKey === selectedSet) || ICON_SET_OPTIONS[0],
    [selectedSet]
  );

  // Filter icons by search
  const filteredNames = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return activeSet.names;
    return activeSet.names.filter((name) => name.toLowerCase().includes(query));
  }, [activeSet, search]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filteredNames.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageNames = filteredNames.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // Reset page when search or set changes
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleSetChange = useCallback((setKey: string) => {
    setSelectedSet(setKey);
    setPage(0);
  }, []);

  const handleSelect = useCallback(
    (iconName: string) => {
      const ref: IconReference = {
        iconSet: activeSet.iconSet,
        iconName: activeSet.prefix ? `${activeSet.prefix}:${iconName}` : iconName,
        size: currentIcon?.size || 24,
        color: currentIcon?.color || 'currentColor',
        strokeWidth: currentIcon?.strokeWidth || 2,
      };
      onSelect(ref);
      onOpenChange(false);
    },
    [activeSet, currentIcon, onSelect, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose Icon</DialogTitle>
        </DialogHeader>

        {/* Search + Set Selector */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search icons..."
              className="pl-9 h-9"
            />
          </div>
          <select
            value={selectedSet}
            onChange={(e) => handleSetChange(e.target.value)}
            className="h-9 px-3 rounded-md border border-gray-200 bg-white text-sm min-w-[180px]"
          >
            <option value="lucide">Lucide (1,736)</option>
            {Object.entries(REACT_ICONS_SETS).map(([prefix, names]) => (
              <option key={prefix} value={`react-icons:${prefix}`}>
                {prefix} ({names.length.toLocaleString()})
              </option>
            ))}
            <option value="svgl">Brands / SVGL ({SVGL_ICONS.length})</option>
          </select>
        </div>

        {/* Results count */}
        <p className="text-xs text-gray-500 mb-2">
          {filteredNames.length.toLocaleString()} icons
          {search ? ` matching "${search}"` : ''}
        </p>

        {/* Icon Grid */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1 p-1">
            {pageNames.map((iconName) => {
              const isSelected =
                currentIcon?.iconName === iconName ||
                currentIcon?.iconName === `${activeSet.prefix}:${iconName}`;
              return (
                <button
                  key={iconName}
                  onClick={() => handleSelect(iconName)}
                  className={`
                    flex flex-col items-center justify-center p-2 rounded-md transition-colors
                    aspect-square gap-1 min-h-0
                    ${
                      isSelected
                        ? 'bg-blue-100 ring-2 ring-blue-500'
                        : 'hover:bg-gray-100 border border-transparent hover:border-gray-200'
                    }
                  `}
                  title={iconName}
                >
                  <IconRenderer
                    icon={{
                      iconSet: activeSet.iconSet,
                      iconName: activeSet.prefix ? `${activeSet.prefix}:${iconName}` : iconName,
                      size: 20,
                      color: 'currentColor',
                      strokeWidth: 2,
                    }}
                    size={20}
                  />
                  <span className="text-[9px] text-gray-500 truncate w-full text-center leading-tight">
                    {iconName.length > 12 ? iconName.slice(0, 12) + '…' : iconName}
                  </span>
                </button>
              );
            })}
          </div>

          {pageNames.length === 0 && (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
              No icons found
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[80px] text-center">
              {safePage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function getStorageKey(icon: IconReference): string {
  if (icon.iconSet === 'lucide') return 'lucide';
  if (icon.iconSet === 'svgl') return 'svgl';
  if (icon.iconSet === 'react-icons') {
    const colonIdx = icon.iconName.indexOf(':');
    if (colonIdx > -1) return `react-icons:${icon.iconName.slice(0, colonIdx)}`;
  }
  return 'lucide';
}
