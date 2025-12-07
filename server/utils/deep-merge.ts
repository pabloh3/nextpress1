/**
 * Deep merges two objects, with source overriding target
 * 
 * Only merges plain objects; arrays and primitives are replaced.
 * Designed for safe settings updates without external dependencies.
 * 
 * @param target - Base object
 * @param source - Object to merge into target
 * @returns New merged object
 * 
 * @example
 * deepMerge(
 *   { general: { siteName: 'Old' }, writing: { auto: true } },
 *   { general: { siteName: 'New' } }
 * )
 * // => { general: { siteName: 'New' }, writing: { auto: true } }
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target } as T;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key as keyof T];

      // If both are plain objects, recurse
      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        (result as any)[key] = deepMerge(targetValue, sourceValue as Partial<typeof targetValue>);
      } else if (sourceValue !== undefined) {
        // Otherwise replace (arrays, primitives, null)
        (result as any)[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * Checks if value is a plain object (not array, null, or other type)
 */
function isPlainObject(value: any): value is Record<string, any> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}
