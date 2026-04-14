/**
 * Variable parser — extracts and resolves {{namespace.field}} patterns in content.
 * Supports fallback syntax: {{namespace.field | "default value"}}
 */

/** Regex to match {{namespace.field}} or {{namespace.field | "fallback"}} */
const VARIABLE_PATTERN = /\{\{(\w+)\.(\w+)(?:\s*\|\s*"([^"]*)")?\}\}/g;

/** A parsed variable reference found in content */
export interface ParsedVariable {
  fullMatch: string;     // The full match: "{{post.title | "Untitled"}}"
  namespace: string;     // The namespace: "post"
  field: string;         // The field: "title"
  fallback?: string;     // Optional fallback: "Untitled"
  startIndex: number;    // Position in the original string
  endIndex: number;      // End position in the original string
}

/**
 * Extract all variable references from a content string.
 * @param content - The content string to parse
 * @returns Array of parsed variable references
 */
export function extractVariables(content: string): ParsedVariable[] {
  const variables: ParsedVariable[] = [];
  let match: RegExpExecArray | null;

  VARIABLE_PATTERN.lastIndex = 0;
  while ((match = VARIABLE_PATTERN.exec(content)) !== null) {
    variables.push({
      fullMatch: match[0],
      namespace: match[1],
      field: match[2],
      fallback: match[3],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return variables;
}

/**
 * Resolve all variables in a content string using the provided variable map.
 * @param content - Content with {{namespace.field}} patterns
 * @param variables - Map of "namespace.field" to resolved values
 * @returns Content with all variables replaced by their values
 */
export function resolveVariables(
  content: string,
  variables: Record<string, string>,
): string {
  return content.replace(VARIABLE_PATTERN, (match, namespace: string, field: string, fallback?: string) => {
    const key = `${namespace}.${field}`;
    const value = variables[key];

    if (value !== undefined && value !== "") {
      return value;
    }

    // Use fallback if provided, otherwise leave the placeholder
    if (fallback !== undefined) {
      return fallback;
    }

    return match;
  });
}

/**
 * Check if a content string contains any variable references.
 * @param content - The content string to check
 * @returns True if the content contains at least one variable
 */
export function hasVariables(content: string): boolean {
  VARIABLE_PATTERN.lastIndex = 0;
  return VARIABLE_PATTERN.test(content);
}

/**
 * Get a list of unique variable keys referenced in the content.
 * @param content - The content string to analyze
 * @returns Array of unique "namespace.field" keys
 */
export function getReferencedVariables(content: string): string[] {
  const variables = extractVariables(content);
  const keys = variables.map((v) => `${v.namespace}.${v.field}`);
  return Array.from(new Set(keys));
}
