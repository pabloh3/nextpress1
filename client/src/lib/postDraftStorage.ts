type Result<T> = { status: true; data: T } | { status: false; message: string };

/** Minimal shape for a post draft — accepts both Post and adapted EditorData */
interface PostDraftData {
	id: string;
	title: string;
	slug: string;
	status: string | null;
	blocks: unknown;
	updatedAt?: Date | string | null;
	[key: string]: unknown;
}

const isStorageAvailable = () => {
	try {
		const testKey = "__np_storage_test__";
		window.localStorage.setItem(testKey, "1");
		window.localStorage.removeItem(testKey);
		return true;
	} catch {
		return false;
	}
};

const getDraftKey = (postId: string) => `page-builder:post:${postId}`;

/**
 * Loads a locally-saved post draft from localStorage.
 * Returns null data if no draft exists for the given post ID.
 */
export const loadPostDraft = (postId: string): Result<PostDraftData | null> => {
	if (!isStorageAvailable()) {
		return { status: false, message: "localStorage is not available" };
	}
	if (!postId) {
		return { status: false, message: "Post ID is required" };
	}
	try {
		const raw = window.localStorage.getItem(getDraftKey(postId));
		if (!raw) {
			return { status: true, data: null };
		}
		const parsed = JSON.parse(raw) as PostDraftData;
		return { status: true, data: parsed };
	} catch (error) {
		return {
			status: false,
			message: error instanceof Error ? error.message : "Failed to load post draft",
		};
	}
};

/**
 * Saves a post draft to localStorage.
 * Unlike pages, posts use a simple single-draft model without version history.
 */
export const savePostDraft = (postId: string, draft: PostDraftData): Result<void> => {
	if (!isStorageAvailable()) {
		return { status: false, message: "localStorage is not available" };
	}
	if (!postId) {
		return { status: false, message: "Post ID is required" };
	}
	try {
		const key = getDraftKey(postId);
		window.localStorage.setItem(key, JSON.stringify(draft));
		return { status: true, data: undefined };
	} catch (error) {
		return {
			status: false,
			message: error instanceof Error ? error.message : "Failed to save post draft",
		};
	}
};

/**
 * Removes a post draft from localStorage.
 * Called after a successful save to the server.
 */
export const clearPostDraft = (postId: string): Result<void> => {
	if (!isStorageAvailable()) {
		return { status: false, message: "localStorage is not available" };
	}
	if (!postId) {
		return { status: false, message: "Post ID is required" };
	}
	try {
		window.localStorage.removeItem(getDraftKey(postId));
		return { status: true, data: undefined };
	} catch (error) {
		return {
			status: false,
			message: error instanceof Error ? error.message : "Failed to clear post draft",
		};
	}
};
