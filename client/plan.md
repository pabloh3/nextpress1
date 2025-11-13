# Renderer Integration Plan for NextPress

## Overview

Integrate the Island Architecture renderer into NextPress to enable server-side rendering of page builder blocks with selective client-side hydration for interactive components.

## Implementation Phases

### Phase 1: Block Type Mapping System

Create adapter module to transform BlockConfig (page builder) → BlockData (renderer), expand renderer block types, and register all components.

### Phase 2: Server Routes for Hydration

Add routes to serve hydration scripts and block components as browser-compatible ESM.

### Phase 3: Integrate Renderer into Routes

Update page/post rendering routes to use renderer when blocks exist, with fallback to theme system.

### Phase 4: Component Compatibility Layer

Create component adapters for unmapped block types and handle missing components gracefully.

### Phase 5: Enhanced Page Template

Update page template with better SEO metadata support.

### Phase 6: Error Handling and Validation

Add comprehensive error handling, block validation, and graceful fallbacks.

### Phase 7: Performance Optimizations

Implement caching, conditional hydration script loading, and lazy component loading.

### Phase 8: Testing Strategy

Write unit, integration, and E2E tests for full renderer functionality.

### Phase 9: Migration and Rollout

Add feature flags, ensure backward compatibility, and plan gradual rollout.

## Key Files to Create/Modify

**New Files:**

- `renderer/adapters/block-adapter.ts` - Block transformation logic
- `renderer/adapters/components/*.tsx` - Component adapters
- `renderer/utils/block-mapper.ts` - Block type mapping registry

**Modified Files:**

- `server/routes.ts` - Add renderer routes and integrate rendering
- `renderer/react/block-types.ts` - Add all block types
- `renderer/react/block-components.tsx` - Register all components
- `renderer/templates/page.ts` - Enhance metadata support