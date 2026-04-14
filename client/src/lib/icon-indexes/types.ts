/**
 * Unified icon reference stored in block content.
 * Used by Icon block and Button icon extension.
 */
export interface IconReference {
  /** Icon set identifier */
  iconSet: 'lucide' | 'react-icons' | 'svgl';

  /**
   * Icon name within the set:
   * - lucide: kebab-case → "arrow-right", "search"
   * - react-icons: prefixed → "lu:LuSearch", "tb:TbArrowLeft", "fa6:FaHouse"
   * - svgl: slug → "github", "react", "vercel"
   */
  iconName: string;

  /** Visual properties */
  size?: number;          // px, default 24
  color?: string;         // CSS color, default "currentColor"
  strokeWidth?: number;   // lucide stroke weight, default 2
}

/** Metadata for an icon set shown in the picker */
export interface IconSetMeta {
  id: string;
  label: string;
  prefix: string;         // react-icons prefix or 'lucide' / 'svgl'
  iconCount: number;
}

/** All supported icon sets */
export const ICON_SETS: IconSetMeta[] = [
  { id: 'lucide', label: 'Lucide', prefix: 'lucide', iconCount: 1736 },
  { id: 'react-icons', label: 'Lucide (react-icons)', prefix: 'lu', iconCount: 1541 },
  { id: 'react-icons', label: 'Tabler', prefix: 'tb', iconCount: 5754 },
  { id: 'react-icons', label: 'Font Awesome 6', prefix: 'fa6', iconCount: 2048 },
  { id: 'react-icons', label: 'Heroicons', prefix: 'hi2', iconCount: 972 },
  { id: 'react-icons', label: 'Remix Icon', prefix: 'ri', iconCount: 3020 },
  { id: 'react-icons', label: 'Phosphor', prefix: 'pi', iconCount: 9072 },
  { id: 'react-icons', label: 'Bootstrap', prefix: 'bs', iconCount: 2716 },
  { id: 'react-icons', label: 'Ionicons', prefix: 'io5', iconCount: 1332 },
  { id: 'react-icons', label: 'Radix', prefix: 'rx', iconCount: 318 },
  { id: 'svgl', label: 'Brands (SVGL)', prefix: 'svgl', iconCount: 100 },
];

/** Get the storage key for an icon set entry */
export function getIconSetStorageKey(set: IconSetMeta): string {
  if (set.id === 'react-icons') return `react-icons:${set.prefix}`;
  return set.id;
}
