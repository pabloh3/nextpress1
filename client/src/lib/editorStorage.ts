import type { BlockConfig } from '@shared/schema-types';

/**
 * Editor state that can be persisted to localStorage
 */
export interface EditorState {
  blocks: BlockConfig[];
  pageTitle: string;
  settingsView: 'page' | 'block';
  lastModified: string;
}

/**
 * Result type for storage operations
 */
interface StorageResult<T> {
  status: boolean;
  data?: T;
  message?: string;
}

const STORAGE_PREFIX = 'nextpress_editor_';
const SLUG_TO_ID_PREFIX = 'nextpress_slug_to_id_';
const STORAGE_VERSION = '1.0';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

/**
 * Generates a storage key for a specific page/post/template
 */
const getStorageKey = (entityId: string | number): string => {
  return `${STORAGE_PREFIX}${entityId}_v${STORAGE_VERSION}`;
};

/**
 * Checks if localStorage is available and functional
 */
const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Estimates the size of data to be stored in bytes
 */
const estimateSize = (data: unknown): number => {
  return new Blob([JSON.stringify(data)]).size;
};

/**
 * Saves editor state to localStorage
 * 
 * @param entityId - The ID of the page/post/template being edited
 * @param state - The editor state to persist
 * @returns Result object indicating success or failure
 */
export const saveEditorState = (
  entityId: string | number,
  state: Partial<EditorState>
): StorageResult<void> => {
  if (!isStorageAvailable()) {
    return {
      status: false,
      message: 'localStorage is not available',
    };
  }

  if (!entityId) {
    return {
      status: false,
      message: 'Entity ID is required',
    };
  }

  try {
    const key = getStorageKey(entityId);
    const existingState = loadEditorState(entityId);
    
    // Merge with existing state
    const mergedState: EditorState = {
      blocks: state.blocks ?? existingState.data?.blocks ?? [],
      pageTitle: state.pageTitle ?? existingState.data?.pageTitle ?? 'Untitled',
      settingsView: state.settingsView ?? existingState.data?.settingsView ?? 'page',
      lastModified: new Date().toISOString(),
    };

    // Check size before saving
    const dataSize = estimateSize(mergedState);
    if (dataSize > MAX_STORAGE_SIZE) {
      return {
        status: false,
        message: `State size (${Math.round(dataSize / 1024)}KB) exceeds limit (${MAX_STORAGE_SIZE / 1024 / 1024}MB)`,
      };
    }

    localStorage.setItem(key, JSON.stringify(mergedState));
    
    return {
      status: true,
    };
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Failed to save editor state',
    };
  }
};

/**
 * Loads editor state from localStorage
 * 
 * @param entityId - The ID of the page/post/template being edited
 * @returns Result object with the loaded state or error message
 */
export const loadEditorState = (
  entityId: string | number
): StorageResult<EditorState> => {
  if (!isStorageAvailable()) {
    return {
      status: false,
      message: 'localStorage is not available',
    };
  }

  if (!entityId) {
    return {
      status: false,
      message: 'Entity ID is required',
    };
  }

  try {
    const key = getStorageKey(entityId);
    const data = localStorage.getItem(key);

    if (!data) {
      return {
        status: false,
        message: 'No saved state found',
      };
    }

    const state = JSON.parse(data) as EditorState;
    
    return {
      status: true,
      data: state,
    };
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Failed to load editor state',
    };
  }
};

/**
 * Clears editor state from localStorage
 * 
 * @param entityId - The ID of the page/post/template being edited
 * @returns Result object indicating success or failure
 */
export const clearEditorState = (
  entityId: string | number
): StorageResult<void> => {
  if (!isStorageAvailable()) {
    return {
      status: false,
      message: 'localStorage is not available',
    };
  }

  if (!entityId) {
    return {
      status: false,
      message: 'Entity ID is required',
    };
  }

  try {
    const key = getStorageKey(entityId);
    localStorage.removeItem(key);
    
    return {
      status: true,
    };
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Failed to clear editor state',
    };
  }
};

/**
 * Gets all stored editor state keys
 * Useful for cleanup and debugging
 * 
 * @returns Array of entity IDs that have stored state
 */
export const getAllStoredEditorKeys = (): string[] => {
  if (!isStorageAvailable()) {
    return [];
  }

  const keys: string[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
  } catch {
    // Silent fail
  }

  return keys;
};

/**
 * Clears all editor states from localStorage
 * Useful for cleanup or resetting
 * 
 * @returns Result object indicating success or failure
 */
export const clearAllEditorStates = (): StorageResult<number> => {
  if (!isStorageAvailable()) {
    return {
      status: false,
      message: 'localStorage is not available',
    };
  }

  try {
    const keys = getAllStoredEditorKeys();
    let cleared = 0;

    keys.forEach(key => {
      localStorage.removeItem(key);
      cleared++;
    });

    return {
      status: true,
      data: cleared,
    };
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Failed to clear all editor states',
    };
  }
};

/**
 * Checks if there is unsaved state for a given entity
 * 
 * @param entityId - The ID of the page/post/template
 * @returns True if unsaved state exists
 */
export const hasUnsavedState = (entityId: string | number): boolean => {
  const result = loadEditorState(entityId);
  return result.status && !!result.data;
};

/**
 * Stores a mapping from slug to page ID for pages
 * This allows reloading pages by slug URL
 * 
 * @param slug - The page slug
 * @param pageId - The page ID (UUID)
 * @returns Result object indicating success or failure
 */
export const storeSlugToIdMapping = (
  slug: string,
  pageId: string
): StorageResult<void> => {
  if (!isStorageAvailable()) {
    return {
      status: false,
      message: 'localStorage is not available',
    };
  }

  if (!slug || !pageId) {
    return {
      status: false,
      message: 'Slug and page ID are required',
    };
  }

  try {
    const key = `${SLUG_TO_ID_PREFIX}${slug}`;
    localStorage.setItem(key, pageId);
    
    return {
      status: true,
    };
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Failed to store slug mapping',
    };
  }
};

/**
 * Retrieves page ID from slug
 * 
 * @param slug - The page slug
 * @returns Result object with the page ID or error message
 */
export const getPageIdFromSlug = (
  slug: string
): StorageResult<string> => {
  if (!isStorageAvailable()) {
    return {
      status: false,
      message: 'localStorage is not available',
    };
  }

  if (!slug) {
    return {
      status: false,
      message: 'Slug is required',
    };
  }

  try {
    const key = `${SLUG_TO_ID_PREFIX}${slug}`;
    const pageId = localStorage.getItem(key);

    if (!pageId) {
      return {
        status: false,
        message: 'No page ID found for this slug',
      };
    }

    return {
      status: true,
      data: pageId,
    };
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve page ID',
    };
  }
};
