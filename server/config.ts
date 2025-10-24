/**
 * Configuration constants for NextPress CMS
 * Centralizes all hardcoded values for better maintainability
 */

export const CONFIG = {
	// Upload configuration
	UPLOAD: {
		LIMIT: 10 * 1024 * 1024, // 10MB
		ALLOWED_MIME_TYPES: [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
			"video/mp4",
			"video/webm",
			"audio/mp3",
			"audio/wav",
			"application/pdf",
			"text/plain",
		],
	},

	// Pagination defaults
	PAGINATION: {
		DEFAULT_PAGE_SIZE: 20,
		DEFAULT_POSTS_PER_PAGE: 10,
		DEFAULT_COMMENTS_PER_PAGE: 10,
		DEFAULT_MEDIA_PER_PAGE: 20,
		DEFAULT_TEMPLATES_PER_PAGE: 10,
		DEFAULT_BLOCKS_PER_PAGE: 10,
	},

	// Status values
	STATUS: {
		ANY: "any",
		PUBLISH: "publish",
		DRAFT: "draft",
		PRIVATE: "private",
		TRASH: "trash",
		PENDING: "pending",
		APPROVED: "approved",
		SPAM: "spam",
		ACTIVE: "active",
		INACTIVE: "inactive",
	},

	// User status values
	USER_STATUS: {
		ACTIVE: "active",
		INACTIVE: "inactive",
		PENDING: "pending",
	},

	// Comment status values
	COMMENT_STATUS: {
		APPROVED: "approved",
		PENDING: "pending",
		SPAM: "spam",
		TRASH: "trash",
	},

	// Site settings defaults
	SITE: {
		DEFAULT_NAME: "NextPress",
		DEFAULT_DESCRIPTION: "A modern WordPress alternative",
	},

	// Password hashing
	PASSWORD: {
		SALT_ROUNDS: 10,
	},

	// File upload
	FILE_UPLOAD: {
		UNIQUE_SUFFIX_LENGTH: 9, // Math.round(Math.random() * 1e9)
	},
} as const;

/**
 * Get site settings with defaults
 * @param req - Express request object
 * @returns Site settings object
 */
export function getSiteSettings(req: any) {
	return {
		name: CONFIG.SITE.DEFAULT_NAME,
		description: CONFIG.SITE.DEFAULT_DESCRIPTION,
		url: `${req.protocol}://${req.get("host")}`,
	};
}

/**
 * Parse pagination parameters with defaults
 * @param query - Query parameters object
 * @param defaultPageSize - Default page size
 * @returns Parsed pagination parameters
 */
export function parsePaginationParams(
	query: any,
	defaultPageSize: number = CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
) {
	const page = parseInt(query.page as string) || 1;
	const per_page = parseInt(query.per_page as string) || defaultPageSize;
	const limit = per_page;
	const offset = (page - 1) * limit;

	return { page, per_page, limit, offset };
}

/**
 * Handle status parameter with 'any' special case
 * @param status - Status parameter
 * @returns Actual status or undefined for 'any'
 */
export function parseStatusParam(
	status: string | undefined,
): string | undefined {
	return status === CONFIG.STATUS.ANY ? undefined : status;
}
