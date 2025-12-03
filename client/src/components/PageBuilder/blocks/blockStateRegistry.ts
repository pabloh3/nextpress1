// client/src/components/PageBuilder/blocks/blockStateRegistry.ts
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
 * Global registry mapping block IDs to their state accessors.
 * Block components register themselves on mount and unregister on unmount.
 */
const blockStateRegistry = new Map<string, BlockStateAccessor>();

/**
 * Register a block's state accessor in the global registry.
 * Called by block components on mount.
 */
export function registerBlockState(blockId: string, accessor: BlockStateAccessor): void {
  blockStateRegistry.set(blockId, accessor);
}

/**
 * Unregister a block's state accessor from the global registry.
 * Called by block components on unmount.
 */
export function unregisterBlockState(blockId: string): void {
  blockStateRegistry.delete(blockId);
}

/**
 * Get a block's state accessor by block ID.
 * Used by settings components to access block state directly.
 */
export function getBlockStateAccessor(blockId: string): BlockStateAccessor | undefined {
  return blockStateRegistry.get(blockId);
}

