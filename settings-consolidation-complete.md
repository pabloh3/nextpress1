# Settings Consolidation - Implementation Complete

## Summary
Successfully consolidated site-wide settings from discrete `options` table rows into a single structured JSON object stored in `sites.settings` (jsonb column).

## Architecture

### Data Structure
Settings are now organized hierarchically:
```
settings (jsonb)
├── general (site info, timezone, date/time formats)
├── writing (editor preferences)
├── reading (pagination, RSS, SEO)
├── discussion (comments, registration)
└── system (caching, APIs, debug)
```

### API Endpoints
- **GET /api/settings** - Returns merged settings (defaults + stored)
- **PATCH /api/settings** - Partial updates with deep merge

### Key Features
- Deep merge: Partial updates preserve unmodified settings
- Defaults: Missing fields automatically filled from `DEFAULT_SETTINGS`
- Validation: Zod schemas enforce structure and types
- Date/time: Uses date-fns tokens with IANA timezone support

## Files Created

### Shared (Schema & Utilities)
- `shared/settings-default.ts` - Default settings constant
- `shared/settings-schema.ts` - Zod validation schemas
- `shared/date-utils.ts` - Date formatting with date-fns

### Server (Business Logic)
- `server/utils/deep-merge.ts` - Safe nested object merge
- `server/routes/settings.routes.ts` - GET/PATCH endpoints

## Files Modified

### Backend
1. **server/storage.ts**
   - Extended `createSiteModel()` with:
     - `getSettings()` - Merges stored + defaults
     - `updateSettings(partial)` - Validates, merges, persists
   - Fixed import paths for deep-merge utility

2. **server/routes/index.ts**
   - Added import: `createSettingsRoutes`
   - Mounted route: `app.use('/api/settings', createSettingsRoutes(deps))`

### Frontend
3. **client/src/pages/Settings.tsx** - Complete refactor
   - **Data Loading**: `useQuery(['/api/settings'])` loads all settings
   - **State Management**: Nested structure matching schema
   - **Form Updates**: Helper functions for each settings section
   - **Save Operation**: Single PATCH with nested object
   - **Date Formats**: Updated to date-fns tokens (from PHP style)
   - **Connected Switches**: All toggles now properly bound to state
   - **Loading State**: Shows loading message until data ready

## Detailed Changes - Settings.tsx

### Before
- Flat `OptionFormData` interface (camelCase fields)
- Multiple POST requests (one per field)
- Disabled query, no data loading
- WordPress-style PHP date tokens (`F j, Y`, `g:i a`)
- Many switches hardcoded with `defaultChecked`

### After
- Nested `Settings` interface (matches schema)
- Single GET loads settings on mount
- Single PATCH saves entire nested structure
- date-fns tokens (`LLLL d, yyyy`, `h:mm a`)
- All switches bound to state with proper handlers

### New Connected Fields
All switches now properly connected:
- **Writing**: `richTextEnabled`, `autosaveEnabled`, `syntaxHighlighting`
- **Reading**: `postsPerPage`, `rssPosts`, `rssEnabled`, `discourageSearchIndexing`
- **Discussion**: `emailNotifications`
- **System**: All 7 switches (`cachingEnabled`, `compressionEnabled`, etc.)

## Backups Created
- `/backup/Settings.tsx.backup` - Original Settings component
- `/backup/Settings-intent.md` - Documentation of changes
- `/backup/storage.ts` - (from previous session)
- `/backup/index.ts` - (from previous session)
- `/backup/intent.md` - (from previous session)

## Technical Decisions

### Why Deep Merge?
Allows partial updates without losing existing settings:
```typescript
// User updates only site name
PATCH /api/settings { general: { siteName: "New Name" } }

// Deep merge ensures other general fields (timezone, etc.) are preserved
```

### Why date-fns Tokens?
- Modern, well-maintained library
- Better i18n support than PHP-style formats
- Consistent with Node.js ecosystem

### Why Single PATCH?
- Atomic updates (all or nothing)
- Simpler error handling
- Single transaction, better consistency
- Reduces network overhead

### Auth Requirement
Both GET and PATCH require authentication:
- Settings contain sensitive info (admin email, debug mode)
- Only authenticated users should read/modify

## Testing Checklist
- [ ] Server starts without errors
- [ ] GET /api/settings returns default settings (first load)
- [ ] Settings page loads and displays defaults
- [ ] All form fields update state correctly
- [ ] Save button sends correct nested structure
- [ ] PATCH /api/settings persists changes
- [ ] Partial updates work (changing one field doesn't affect others)
- [ ] Invalid data returns validation error
- [ ] Unauthenticated requests are rejected
- [ ] Success/error toasts display properly

## Next Steps (If Needed)
1. **Migration**: Create script to migrate from `options` table
2. **UI Polish**: Add format hints for date/time fields
3. **Validation**: Add client-side validation before save
4. **Preview**: Show formatted date/time examples
5. **Timezone Selector**: Replace text input with dropdown

## Notes
- No migration from `options` table - clean start
- Old `/api/options` endpoints still work (for compatibility)
- Settings are site-scoped (default site in multi-site setup)
- `meta.version` field not added (not needed for current use)
