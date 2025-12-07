import type { Page, PageDraft, PageVersionEntry, BlockConfig } from "@shared/schema-types";

type Result<T> = { status: true; data: T } | { status: false; message: string };

const MAX_HISTORY = 3;

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

const getDraftKey = (pageId: string) => `page-builder:page:${pageId}`;

const toHistoryEntry = (draft: PageDraft): PageVersionEntry => ({
	version: draft.version ?? draft.localVersion ?? 0,
	updatedAt: draft.updatedAt || new Date().toISOString(),
	blocks: (draft as Page).blocks as BlockConfig[],
	authorId: (draft as any).authorId,
});

export const loadPageDraft = (pageId: string): Result<PageDraft | null> => {
	if (!isStorageAvailable()) {
		return { status: false, message: "localStorage is not available" };
	}
	if (!pageId) {
		return { status: false, message: "Page ID is required" };
	}
	try {
		const raw = window.localStorage.getItem(getDraftKey(pageId));
		if (!raw) {
			return { status: true, data: null };
		}
		const parsed = JSON.parse(raw) as { current: PageDraft; history?: PageVersionEntry[] };
		return { status: true, data: parsed.current };
	} catch (error) {
		return {
			status: false,
			message: error instanceof Error ? error.message : "Failed to load page draft",
		};
	}
};

export const loadPageHistory = (pageId: string): Result<PageVersionEntry[]> => {
	if (!isStorageAvailable()) {
		return { status: false, message: "localStorage is not available" };
	}
	if (!pageId) {
		return { status: false, message: "Page ID is required" };
	}
	try {
		const raw = window.localStorage.getItem(getDraftKey(pageId));
		if (!raw) {
			return { status: true, data: [] };
		}
		const parsed = JSON.parse(raw) as { current: PageDraft; history?: PageVersionEntry[] };
		return { status: true, data: parsed.history ?? [] };
	} catch (error) {
		return {
			status: false,
			message: error instanceof Error ? error.message : "Failed to load page history",
		};
	}
};

export const savePageDraft = (pageId: string, draft: PageDraft): Result<void> => {
	if (!isStorageAvailable()) {
		return { status: false, message: "localStorage is not available" };
	}
	if (!pageId) {
		return { status: false, message: "Page ID is required" };
	}
	try {
		const key = getDraftKey(pageId);
		const raw = window.localStorage.getItem(key);
		const parsed = raw ? (JSON.parse(raw) as { current: PageDraft; history?: PageVersionEntry[] }) : null;
		const history = parsed?.history ?? [];
		const envelope = { current: draft, history };
		window.localStorage.setItem(key, JSON.stringify(envelope));
		return { status: true, data: undefined };
	} catch (error) {
		return {
			status: false,
			message: error instanceof Error ? error.message : "Failed to save page draft",
		};
	}
};

export const savePageDraftWithHistory = (
	pageId: string,
	draft: PageDraft,
	maxHistory = MAX_HISTORY,
): Result<void> => {
	if (!isStorageAvailable()) {
		return { status: false, message: "localStorage is not available" };
	}
	if (!pageId) {
		return { status: false, message: "Page ID is required" };
	}
	try {
		const key = getDraftKey(pageId);
		const raw = window.localStorage.getItem(key);
		const parsed = raw ? (JSON.parse(raw) as { current: PageDraft; history?: PageVersionEntry[] }) : null;

		const history = parsed?.history ? [...parsed.history] : [];
		if (parsed?.current) {
			history.push(toHistoryEntry(parsed.current));
		}
		const trimmedHistory = history.slice(-maxHistory);

		const envelope = { current: draft, history: trimmedHistory };
		window.localStorage.setItem(key, JSON.stringify(envelope));
		return { status: true, data: undefined };
	} catch (error) {
		return {
			status: false,
			message: error instanceof Error ? error.message : "Failed to save page draft with history",
		};
	}
};

export const clearPageDraft = (pageId: string): Result<void> => {
	if (!isStorageAvailable()) {
		return { status: false, message: "localStorage is not available" };
	}
	if (!pageId) {
		return { status: false, message: "Page ID is required" };
	}
	try {
		window.localStorage.removeItem(getDraftKey(pageId));
		return { status: true, data: undefined };
	} catch (error) {
		return {
			status: false,
			message: error instanceof Error ? error.message : "Failed to clear page draft",
		};
	}
};

