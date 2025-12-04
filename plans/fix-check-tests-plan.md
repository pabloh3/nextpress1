# Plan: Fix `pnpm check` and `pnpm test`

## Context
- `pnpm check` currently fails with 40+ TS errors coming from server routes, shared utilities, and auth integration.
- `pnpm test` fails in the UI suites (`SiteMenu`, `PagesMenu`, `useContentLists`) because their assumptions about dropdown interactions and query client defaults no longer match the implementation.
- Several server-side files live under `/server` and `/shared`; per workspace rules we need to be deliberate, document intent, and back up files before touching them.

## Steps
1. **Type Declaration + Utility Fixes**
   - Add an ambient module declaration for `openid-client/passport` so `server/replitAuth.ts` stops failing the import resolution check without altering tsconfig.
   - Tighten `server/routes/shared/date-coerce.ts` to use `keyof T` indexing so generic writes are legal under `noUncheckedIndexedAccess`.

2. **Zod Schema Typing + Slug Guards**
   - Rework `shared/zod-schema.ts` so `getZodSchema` preserves table-specific types (avoid the `Record<string, any>` loss) and therefore `schema.parse()` returns properly typed objects.
   - Update the routes that derive slugs (`pages.routes.ts`, `posts.routes.ts`) to guard against nullable titles before calling `.toLowerCase()`.

3. **Theme + Deep Merge Types**
   - Extend the theme table/type to expose an optional `renderer` field (resolving `server/themes.ts` complaints) and ensure `deep-merge.ts` works with stricter generics.

4. **Database Abstractions**
   - Make `shared/create-models.ts` database-agnostic by widening `DatabaseInstance` (support Neon + Pglite) and aligning `withTransaction` with Drizzle's `PgTransaction` signature.
   - Mirror the same typing adjustments in the test helpers so `server/test/*.ts` compile without expecting a Neon-only client.

5. **React Query Defaults & Dropdown Tests**
   - Update `client/src/test/useContentLists.test.tsx` to use the same default query function as the production query client (or import it) so queries actually resolve in tests.
   - Update the dropdown-oriented tests (`SiteMenu.test.tsx`, `PagesMenu.test.tsx`) to use `userEvent` (pointer-aware) instead of plain `fireEvent.click`, ensuring Radix DropdownMenu opens in jsdom.

6. **Verification**
   - Re-run `pnpm check` and `pnpm test` to confirm both pipelines are green, documenting any remaining known issues.
