// client/src/components/PageBuilder/blocks/blockStateRegistry.ts
import { useSyncExternalStore } from "react";
import type { BlockConfig } from "@shared/schema-types";
import type React from "react";

/**
 * Interface for accessing and modifying block component state.
 * Allows settings components to directly access and update block state
 * without going through parent state updates.
 */
export interface BlockStateAccessor {
	/** Get the current content state */
	getContent: () => any;
	/** Get the current styles state */
	getStyles: () => React.CSSProperties | undefined;
	/** Get the current settings state */
	getSettings: () => Record<string, any> | undefined;
	/** Update the content state */
	setContent: (content: any) => void;
	/** Update the styles state */
	setStyles: (styles: React.CSSProperties | undefined) => void;
	/** Update the settings state */
	setSettings: (settings: Record<string, any> | undefined) => void;
	/** Get the full block state (for saving) */
	getFullState: () => BlockConfig;
}

/**
 * External store for block state accessors.
 * Uses useSyncExternalStore pattern so consuming components automatically
 * re-render when registry entries are added, removed, or replaced.
 */
const blockStateRegistry = new Map<string, BlockStateAccessor>();
const subscribers = new Set<() => void>();
let version = 0;

/** Notify all subscribers that the registry changed. */
function emitChange(): void {
	version += 1;
	subscribers.forEach((callback) => callback());
}

/**
 * Register a block's state accessor in the global registry.
 * Called by block components during render (synchronous registration).
 * Suppresses emitChange when re-registering the same block ID since
 * refs keep accessors fresh automatically — avoids unnecessary subscriber noise.
 */
export function registerBlockState(
	blockId: string,
	accessor: BlockStateAccessor,
): void {
	const existing = blockStateRegistry.get(blockId);
	blockStateRegistry.set(blockId, accessor);
	// Only notify subscribers for genuinely new registrations
	if (!existing) {
		emitChange();
	}
}

/**
 * Unregister a block's state accessor from the global registry.
 * Called by block components on unmount via cleanup.
 */
export function unregisterBlockState(blockId: string): void {
	blockStateRegistry.delete(blockId);
	emitChange();
}

/**
 * Subscribe to registry changes (for useSyncExternalStore).
 * Returns an unsubscribe function.
 */
function subscribe(callback: () => void): () => void {
	subscribers.add(callback);
	return () => {
		subscribers.delete(callback);
	};
}

/** Snapshot of the current registry version (for useSyncExternalStore). */
function getSnapshot(): number {
	return version;
}

/**
 * Get a block's state accessor by block ID.
 * Imperative getter for use outside React components (event handlers, etc).
 */
export function getBlockStateAccessor(
	blockId: string,
): BlockStateAccessor | undefined {
	return blockStateRegistry.get(blockId);
}

/**
 * React hook that subscribes to registry changes and returns the accessor
 * for the given block ID. Re-renders the consuming component whenever the
 * registry is updated (block registered/unregistered/replaced).
 *
 * Uses useSyncExternalStore internally — this is a custom hook,
 * so direct use of React primitives here is allowed per no-use-effect rules.
 */
export function useBlockAccessor(
	blockId: string | undefined,
): BlockStateAccessor | undefined {
	useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	if (!blockId) return undefined;
	return blockStateRegistry.get(blockId);
}
