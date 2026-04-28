# Homepage And Admin Routing Task

## Intent
Implement homepage selection for published pages and move admin/auth screens under `/admin`.

## Approach
- Reuse the existing `homepage_page_slug` option to avoid database schema changes.
- Add homepage controls in the Pages list and Page Builder page settings.
- Render the configured homepage at `/`.
- Move admin/auth routes and internal admin links to `/admin/*`.

## Constraints
- No database commands or migrations.
- No dependency installs.
- Preserve existing public `/page/:slug`, `/post/:slug`, and preview routes.
