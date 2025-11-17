/**
 * Generates a URL-friendly slug from a title string.
 * Converts to lowercase, replaces non-alphanumeric chars with hyphens, removes leading/trailing hyphens.
 * 
 * @param title - The title string to convert
 * @returns URL-friendly slug
 * 
 * @example
 * generateSlug('Hello World!') // 'hello-world'
 * generateSlug('My First Post: A Guide') // 'my-first-post-a-guide'
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
