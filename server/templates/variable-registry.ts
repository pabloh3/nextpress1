/**
 * Variable registry — defines all available template variable namespaces.
 * Each namespace groups related variables and provides a resolver function
 * that extracts values from the render context.
 */

import type { VariableNamespace, RenderContext } from "./types";

/** Site-level variables */
const siteNamespace: VariableNamespace = {
  name: "site",
  label: "Site",
  description: "Site-wide settings and configuration",
  variables: [
    { key: "title", label: "Site Title", description: "The site title from settings", example: "My Website" },
    { key: "url", label: "Site URL", description: "The site base URL", example: "https://example.com" },
    { key: "description", label: "Site Description", description: "The site tagline or description", example: "A great website" },
    { key: "language", label: "Site Language", description: "The site language code", example: "en" },
  ],
  resolve: (ctx) => ({
    "site.title": ctx.site?.title ?? "",
    "site.url": ctx.site?.url ?? "",
    "site.description": ctx.site?.description ?? "",
    "site.language": ctx.site?.language ?? "en",
  }),
};

/** Post-level variables */
const postNamespace: VariableNamespace = {
  name: "post",
  label: "Post",
  description: "Current post data",
  variables: [
    { key: "title", label: "Post Title", description: "The post title", example: "Hello World" },
    { key: "slug", label: "Post Slug", description: "The post URL slug", example: "hello-world" },
    { key: "date", label: "Post Date", description: "The post publish date", example: "2025-01-15" },
    { key: "modified_date", label: "Modified Date", description: "The post last modified date", example: "2025-02-01" },
    { key: "excerpt", label: "Post Excerpt", description: "The post excerpt or summary", example: "A short summary..." },
    { key: "author", label: "Post Author", description: "The post author name", example: "John Doe" },
    { key: "url", label: "Post URL", description: "The post permalink", example: "https://example.com/hello-world" },
    { key: "featured_image", label: "Featured Image", description: "The post featured image URL", example: "https://example.com/image.jpg" },
  ],
  resolve: (ctx) => ({
    "post.title": String(ctx.post?.title ?? ""),
    "post.slug": String(ctx.post?.slug ?? ""),
    "post.date": String(ctx.post?.date ?? ""),
    "post.modified_date": String(ctx.post?.modifiedDate ?? ""),
    "post.excerpt": String(ctx.post?.excerpt ?? ""),
    "post.author": String(ctx.post?.author ?? ""),
    "post.url": String(ctx.post?.url ?? ""),
    "post.featured_image": String(ctx.post?.featuredImage ?? ""),
  }),
};

/** Page-level variables */
const pageNamespace: VariableNamespace = {
  name: "page",
  label: "Page",
  description: "Current page data",
  variables: [
    { key: "title", label: "Page Title", description: "The page title", example: "About Us" },
    { key: "slug", label: "Page Slug", description: "The page URL slug", example: "about-us" },
    { key: "url", label: "Page URL", description: "The page permalink", example: "https://example.com/about-us" },
  ],
  resolve: (ctx) => ({
    "page.title": ctx.page?.title ?? "",
    "page.slug": ctx.page?.slug ?? "",
    "page.url": ctx.page?.url ?? "",
  }),
};

/** Author-level variables */
const authorNamespace: VariableNamespace = {
  name: "author",
  label: "Author",
  description: "Post or page author information",
  variables: [
    { key: "name", label: "Author Name", description: "The author display name", example: "Jane Doe" },
    { key: "avatar", label: "Author Avatar", description: "The author avatar URL", example: "https://example.com/avatar.jpg" },
    { key: "bio", label: "Author Bio", description: "The author biography", example: "Writer and developer" },
    { key: "url", label: "Author URL", description: "The author profile URL", example: "https://example.com/author/jane" },
  ],
  resolve: (ctx) => ({
    "author.name": ctx.author?.name ?? "",
    "author.avatar": ctx.author?.avatar ?? "",
    "author.bio": ctx.author?.bio ?? "",
    "author.url": ctx.author?.url ?? "",
  }),
};

/** Date/time variables */
const dateNamespace: VariableNamespace = {
  name: "date",
  label: "Date",
  description: "Current date and time",
  variables: [
    { key: "now", label: "Current Date", description: "Current date (YYYY-MM-DD)", example: "2025-06-15" },
    { key: "year", label: "Current Year", description: "Current year", example: "2025" },
    { key: "month", label: "Current Month", description: "Current month (01-12)", example: "06" },
    { key: "day", label: "Current Day", description: "Current day (01-31)", example: "15" },
    { key: "time", label: "Current Time", description: "Current time (HH:MM)", example: "14:30" },
  ],
  resolve: () => {
    const now = new Date();
    return {
      "date.now": now.toISOString().split("T")[0],
      "date.year": String(now.getFullYear()),
      "date.month": String(now.getMonth() + 1).padStart(2, "0"),
      "date.day": String(now.getDate()).padStart(2, "0"),
      "date.time": now.toTimeString().slice(0, 5),
    };
  },
};

/** All registered namespaces */
const namespaces: VariableNamespace[] = [
  siteNamespace,
  postNamespace,
  pageNamespace,
  authorNamespace,
  dateNamespace,
];

/**
 * Get all registered variable namespaces.
 * @returns Array of variable namespace definitions
 */
export function getVariableNamespaces(): VariableNamespace[] {
  return namespaces;
}

/**
 * Get a specific namespace by name.
 * @param name - The namespace name (e.g., "site", "post")
 * @returns The namespace or undefined if not found
 */
export function getNamespace(name: string): VariableNamespace | undefined {
  return namespaces.find((ns) => ns.name === name);
}

/**
 * Resolve all variables for a given render context.
 * Returns a flat map of "namespace.key" → resolved value.
 * @param context - The render context with site, post, page, author data
 * @returns Record of all variable keys to their resolved values
 */
export function resolveAllVariables(context: RenderContext): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const ns of namespaces) {
    Object.assign(resolved, ns.resolve(context));
  }
  return resolved;
}
