/**
 * Safe execution utility for handling errors gracefully
 * Follows the safeTry pattern specified in AGENTS.md
 */

export interface SafeTryResult<T> {
	err: Error | null;
	result: T | null;
}

/**
 * Execute a function safely and return structured result
 * @param fn - Function to execute
 * @returns Object with err and result properties
 */
export function safeTry<T>(
	fn: () => T | Promise<T>,
): Promise<SafeTryResult<T>> | SafeTryResult<T> {
	try {
		const result = fn();
		if (result instanceof Promise) {
			return result
				.then((value) => ({ err: null, result: value }))
				.catch((error) => ({ err: error, result: null }));
		}
		return { err: null, result };
	} catch (error) {
		return { err: error as Error, result: null };
	}
}

/**
 * Execute an async function safely and return structured result
 * @param fn - Async function to execute
 * @returns Promise with err and result properties
 */
export async function safeTryAsync<T>(
	fn: () => Promise<T>,
): Promise<SafeTryResult<T>> {
	try {
		const result = await fn();
		return { err: null, result };
	} catch (error) {
		return { err: error as Error, result: null };
	}
}

/**
 * Handle safeTry result in Express route handler
 * @param safeResult - Result from safeTry
 * @param res - Express response object
 * @param successMessage - Optional success message
 * @param errorMessage - Optional error message
 * @returns True if handled, false if caller should continue
 */
export function handleSafeTryResult<T>(
	safeResult: SafeTryResult<T>,
	res: any,
	successMessage?: string,
	errorMessage?: string,
): boolean {
	if (safeResult.err) {
		console.error("SafeTry error:", safeResult.err);
		res.status(500).json({
			message: errorMessage || "Operation failed",
			error: safeResult.err.message,
		});
		return true;
	}

	if (successMessage) {
		res.json({ message: successMessage, data: safeResult.result });
	} else {
		res.json(safeResult.result);
	}
	return false;
}
