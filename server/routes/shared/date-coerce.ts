/**
 * Coerces ISO date strings to Date objects for specified fields.
 * Used to safely convert user-supplied date strings before Zod validation.
 * 
 * @param data - The request body data
 * @param fields - Array of field names to coerce to Date objects
 * @returns The data with specified fields converted to Date objects
 * 
 * @example
 * const data = coerceDates(req.body, ['publishedAt', 'createdAt']);
 * const validated = schema.parse(data);
 */
export function coerceDates<T extends Record<string, any>>(
  data: T,
  fields: string[]
): T {
  const result = { ...data } as T;
  
  for (const field of fields) {
    if (field in result && typeof result[field as keyof T] === 'string') {
      try {
        (result as any)[field] = new Date(result[field as keyof T] as string);
      } catch (error) {
        // If date parsing fails, leave as is and let Zod validation handle it
        console.warn(`Failed to coerce ${field} to Date:`, error);
      }
    }
  }
  
  return result;
}
