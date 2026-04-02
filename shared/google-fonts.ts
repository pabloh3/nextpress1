/**
 * Maps font-family CSS values to Google Fonts CDN URLs.
 * Web-safe fonts (system-ui, Georgia, etc.) return null since they don't need loading.
 */

/** Fonts that are available on all systems and don't need a CDN link */
const WEB_SAFE_FONTS = new Set(['system-ui', 'Georgia, serif']);

/**
 * Extracts the primary font name from a CSS font-family value
 * and returns the Google Fonts CDN URL, or null if web-safe.
 *
 * @example
 * getGoogleFontUrl('Inter, sans-serif') // 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
 * getGoogleFontUrl('system-ui') // null
 * getGoogleFontUrl(undefined) // null
 */
export const getGoogleFontUrl = (fontFamily: string | undefined): string | null => {
  if (!fontFamily) return null;
  if (WEB_SAFE_FONTS.has(fontFamily)) return null;

  // Extract primary font name: strip quotes and everything after the first comma
  const primaryFont = fontFamily.split(',')[0].trim().replace(/["']/g, '');
  if (!primaryFont || primaryFont === 'system-ui') return null;

  const encoded = encodeURIComponent(primaryFont);
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700&display=swap`;
};
