/**
 * Render context builder — constructs a RenderContext from an Express request.
 * Gathers site settings, current user, post/page data, and request metadata.
 */

import type { Request } from "express";
import type { RenderContext } from "./types";

interface BuildContextOptions {
  /** Site configuration data */
  site?: {
    title?: string;
    url?: string;
    description?: string;
    language?: string;
    [key: string]: string | undefined;
  };
  /** Current post data (if rendering a post) */
  post?: {
    id?: string;
    title?: string;
    slug?: string;
    date?: string;
    modifiedDate?: string;
    excerpt?: string;
    content?: string;
    author?: string;
    categories?: string[];
    tags?: string[];
    featuredImage?: string;
    url?: string;
    [key: string]: unknown;
  };
  /** Current page data (if rendering a page) */
  page?: {
    id?: string;
    title?: string;
    slug?: string;
    url?: string;
    [key: string]: string | undefined;
  };
  /** Current author data */
  author?: {
    id?: string;
    name?: string;
    avatar?: string;
    bio?: string;
    url?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Build a render context from an Express request and optional data.
 * @param req - Express request object
 * @param options - Optional data overrides for site, post, page, author
 * @returns A complete render context for variable resolution and condition evaluation
 */
export function buildRenderContext(
  req: Request,
  options: BuildContextOptions = {},
): RenderContext {
  const user = (req as any).user;

  return {
    site: options.site ?? {},
    post: options.post,
    page: options.page,
    author: options.author,
    user: user
      ? {
          id: user.id,
          name: user.name ?? user.displayName,
          email: user.email,
          role: user.role,
          isLoggedIn: true,
        }
      : { isLoggedIn: false },
    request: {
      url: req.originalUrl,
      path: req.path,
      device: detectDevice(req),
    },
  };
}

/**
 * Detect device type from the request User-Agent header.
 * @param req - Express request object
 * @returns Device type: "mobile", "tablet", or "desktop"
 */
function detectDevice(req: Request): "mobile" | "tablet" | "desktop" {
  const ua = (req.headers["user-agent"] ?? "").toLowerCase();

  if (/ipad|tablet|android(?!.*mobile)/.test(ua)) {
    return "tablet";
  }

  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/.test(ua)) {
    return "mobile";
  }

  return "desktop";
}
