# Block Design System

A comprehensive guide for designing consistent, accessible, and maintainable blocks in NextPress Page Builder.

## Table of Contents
- [Design Principles](#design-principles)
- [Visual System](#visual-system)
- [Component Structure](#component-structure)
- [Settings Organization](#settings-organization)
- [Interaction Patterns](#interaction-patterns)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Implementation Checklist](#implementation-checklist)

---

## Design Principles

### 1. **Consistency First**
- Use established patterns across all blocks
- Maintain visual and behavioral consistency
- Follow the defined color system and spacing

### 2. **Progressive Disclosure**
- Essential settings visible by default
- Advanced options behind collapsible sections
- Logical information hierarchy

### 3. **Accessibility by Design**
- High contrast ratios
- Keyboard navigation support
- Screen reader compatibility
- Clear focus indicators

### 4. **Mobile-First Approach**
- Touch-friendly interactive elements
- Responsive layouts
- Readable text sizes

---

## Visual System

### Color Palette

```css
/* Selected States */
bg-gray-200 text-gray-800 hover:bg-gray-300

/* Unselected States */
bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300

/* Active Navigation */
text-black bg-white

/* Inactive Navigation */
text-gray-600

/* Background Context */
bg-gray-50

/* Borders & Focus */
border-gray-200
focus:ring-gray-400
hover:border-gray-300
```

### Typography Scale

```css
/* Section Headers */
text-sm font-semibold text-gray-800

/* Form Labels */
text-sm font-medium text-gray-700

/* Button Text */
text-xs font-medium

/* Input Text */
text-sm

/* Icon Sizes */
w-3 h-3  /* Compact icons */
w-4 h-4  /* Standard icons */
```

### Spacing System

```css
/* Component Spacing */
space-y-4  /* Vertical rhythm */
space-y-3  /* Tight sections */

/* Button Padding */
px-3 py-2  /* Standard buttons */
h-8 px-3   /* Compact buttons */

/* Input Heights */
h-8   /* Compact inputs */
h-9   /* Standard inputs */
h-10  /* Prominent inputs */

/* Card Padding */
p-4   /* Content breathing room */

/* Grid Gaps */
gap-2  /* Button grids */
gap-3  /* Form elements */
```

### Layout Patterns

```css
/* Grid Systems */
grid-cols-1  /* Single option */
grid-cols-2  /* Pair or 3+ options (2x2 grid) */

/* Border Radius */
rounded-none  /* Geometric aesthetic */
rounded-md    /* Interactive elements */
rounded-lg    /* Cards/containers */
```

---

## Component Structure

### Block Definition Template

```typescript
import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { IconName, Type, Settings, AdvancedIcon } from "lucide-react";

// 1. Content Interface
interface YourBlockContent {
  // Define block-specific content properties
  text?: string;
  url?: string;
  // ... other properties
}

interface YourBlockConfig extends Omit<BlockConfig, 'content'> {
  content?: YourBlockContent;
}

// 2. Renderer Component
function YourBlockRenderer({ block, isPreview }: { block: YourBlockConfig; isPreview: boolean }) {
  // Render logic with proper styling
  return (
    <div className="your-block-wrapper" style={block.styles}>
      {/* Block content */}
    </div>
  );
}

// 3. Settings Component
function YourBlockSettings({ block, onUpdate }: { 
  block: YourBlockConfig; 
  onUpdate: (updates: Partial<YourBlockConfig>) => void 
}) {
  const updateContent = (contentUpdates: any) => {
    onUpdate({
      content: {
        ...block.content,
        ...contentUpdates,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Content Section */}
      <CollapsibleCard title="Content" icon={Type} defaultOpen={true}>
        {/* Primary content controls */}
      </CollapsibleCard>
      
      {/* Settings Section */}
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        {/* Configuration controls */}
      </CollapsibleCard>
      
      {/* Advanced Section */}
      <CollapsibleCard title="Advanced" icon={Settings} defaultOpen={false}>
        {/* Optional/advanced controls */}
      </CollapsibleCard>
    </div>
  );
}

// 4. Block Export
export const YourBlock: BlockDefinition = {
  id: 'core/your-block',
  name: 'Your Block',
  icon: IconName,
  description: 'Brief description of block functionality',
  category: 'basic', // or 'layout', 'media', 'embed'
  defaultContent: {
    // Default content values
  },
  defaultStyles: {
    // Default styling values
  },
  renderer: YourBlockRenderer,
  settings: YourBlockSettings
};

export default YourBlock;
```

---

## Settings Organization

### CollapsibleCard Structure

#### 1. **Content Card** (`defaultOpen: true`)
Primary content that users interact with most frequently:
- Text inputs
- Media selection
- Basic configuration

#### 2. **Settings Card** (`defaultOpen: true`)
Block-specific configuration options:
- Layout options
- Behavioral settings
- Display preferences

#### 3. **Advanced Card** (`defaultOpen: false`)
Technical or rarely-used options:
- CSS classes
- Anchor IDs
- Advanced attributes

### Naming Conventions

```typescript
// Card Titles
"Content"     // Primary content editing
"Settings"    // Block configuration  
"Link Settings" // Link-specific options
"Alignment"   // Positioning options
"Advanced"    // Technical options

// Icons (from lucide-react)
Type        // Content
Settings    // Configuration
Link        // URL/linking
AlignLeft   // Alignment
Code        // Advanced/CSS
```

---

## Interaction Patterns

### ChipGroup Component Usage

For multiple-choice options, use the established ChipGroup pattern:

```typescript
// Font Weight Example
<ChipGroup
  label="Font Weight"
  icon={Bold}
  options={[
    { value: '300', label: 'Light', icon: Minus },
    { value: 'normal', label: 'Normal', icon: Circle },
    { value: '500', label: 'Medium', icon: Square },
    { value: 'bold', label: 'Bold', icon: Bold },
  ]}
  value={block.styles?.fontWeight || 'normal'}
  onChange={(value) => updateStyles({ fontWeight: value })}
/>
```

### Button States Template

```typescript
className={`h-8 px-3 text-xs font-medium rounded-md transition-all ${
  selectedCondition
    ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
}`}
```

### Input Patterns

```typescript
// Standard Input
<Input
  id="unique-id"
  value={block.content?.property || ''}
  onChange={(e) => updateContent({ property: e.target.value })}
  placeholder="Helpful placeholder"
  className="mt-1 h-9"
/>

// With Label
<div>
  <Label htmlFor="unique-id" className="text-sm font-medium text-gray-700">
    Property Name
  </Label>
  <Input
    id="unique-id"
    value={block.content?.property || ''}
    onChange={(e) => updateContent({ property: e.target.value })}
    placeholder="Helpful placeholder"
    className="mt-1 h-9"
  />
</div>
```

---

## Accessibility Guidelines

### 1. **Form Labels**
- Always associate labels with inputs using `htmlFor`
- Use descriptive, clear label text
- Include icons for visual hierarchy

### 2. **Focus Management**
- Ensure all interactive elements are keyboard accessible
- Use proper focus indicators (`focus:ring-gray-400`)
- Logical tab order

### 3. **ARIA Attributes**
- Use appropriate ARIA labels for screen readers
- Include `title` attributes for truncated text
- Proper heading hierarchy

### 4. **Color Contrast**
- Meet WCAG AA standards (4.5:1 ratio minimum)
- Don't rely solely on color for information
- Use icons + text combinations

### 5. **Touch Targets**
- Minimum 44px touch targets (use `h-8` minimum)
- Adequate spacing between interactive elements
- Mobile-friendly sizing

---

## Implementation Checklist

### ✅ **Before Development**
- [ ] Define block purpose and user needs
- [ ] Plan content structure and data types
- [ ] Identify required settings and organization
- [ ] Choose appropriate icons from Lucide React

### ✅ **During Development**
- [ ] Follow component structure template
- [ ] Use established color system
- [ ] Implement proper spacing and typography
- [ ] Add CollapsibleCard organization
- [ ] Include proper TypeScript interfaces
- [ ] Handle edge cases and fallbacks

### ✅ **Settings Implementation**
- [ ] Content card with essential options (defaultOpen: true)
- [ ] Settings card for configuration (defaultOpen: true)
- [ ] Advanced card for technical options (defaultOpen: false)
- [ ] Consistent button states and interactions
- [ ] Proper form labels and IDs

### ✅ **Testing & Validation**
- [ ] Test build process (`npm run build`)
- [ ] Verify responsive behavior
- [ ] Test keyboard navigation
- [ ] Validate screen reader compatibility
- [ ] Check color contrast ratios
- [ ] Test with different content lengths
- [ ] Verify default values work correctly

### ✅ **Documentation**
- [ ] Add clear block description
- [ ] Document any special behaviors
- [ ] Include usage examples if complex
- [ ] Update block registry if needed

---

## Common Patterns Reference

### Typography Controls
```typescript
// Font Size Input
<Input
  value={block.styles?.fontSize || '16px'}
  onChange={(e) => updateStyles({ fontSize: e.target.value })}
  placeholder="16px"
  className="mt-2 h-9 text-sm"
/>

// Font Weight ChipGroup
<ChipGroup
  label="Font Weight"
  icon={Bold}
  options={[
    { value: '300', label: 'Light' },
    { value: 'normal', label: 'Normal' },
    { value: '500', label: 'Medium' },
    { value: 'bold', label: 'Bold' },
  ]}
  value={block.styles?.fontWeight || 'normal'}
  onChange={(value) => updateStyles({ fontWeight: value })}
/>
```

### Color Controls
```typescript
// Color Picker + Text Input
<div className="flex gap-3 mt-2">
  <Input
    type="color"
    value={block.styles?.color || '#000000'}
    onChange={(e) => updateStyles({ color: e.target.value })}
    className="w-12 h-9 p-1 border-gray-200 rounded-none"
  />
  <Input
    value={block.styles?.color || '#000000'}
    onChange={(e) => updateStyles({ color: e.target.value })}
    placeholder="#000000"
    className="flex-1 h-9 text-sm"
  />
</div>
```

### Alignment Controls
```typescript
<ChipGroup
  label="Text Alignment"
  icon={AlignCenter}
  options={[
    { value: 'left', label: 'Left', icon: AlignLeft },
    { value: 'center', label: 'Center', icon: AlignCenter },
    { value: 'right', label: 'Right', icon: AlignRight },
    { value: 'justify', label: 'Justify', icon: AlignJustify },
  ]}
  value={block.styles?.textAlign || 'left'}
  onChange={(value) => updateStyles({ textAlign: value })}
/>
```

---

## Design System Benefits

Following this design system ensures:

- **Consistency** across all blocks
- **Accessibility** compliance
- **Maintainability** of codebase
- **User Experience** predictability
- **Developer Experience** efficiency
- **Visual Cohesion** in the interface

By adhering to these guidelines, every block will feel native to the NextPress ecosystem while maintaining its unique functionality.