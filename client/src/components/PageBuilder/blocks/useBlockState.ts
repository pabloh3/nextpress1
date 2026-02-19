import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { BlockConfig } from "@shared/schema-types";
import { nanoid } from "nanoid";
import {
	registerBlockState,
	unregisterBlockState,
} from "./blockStateRegistry";

interface UseBlockStateOptions<TContent> {
	value: BlockConfig;
	getDefaultContent: () => TContent;
	onChange: (block: BlockConfig) => void;
}

interface UseBlockStateResult<TContent> {
	clientId: string;
	content: TContent;
	setContent: React.Dispatch<React.SetStateAction<TContent>>;
	styles: React.CSSProperties | undefined;
	setStyles: React.Dispatch<
		React.SetStateAction<React.CSSProperties | undefined>
	>;
	settings: Record<string, any> | undefined;
	setSettings: React.Dispatch<
		React.SetStateAction<Record<string, any> | undefined>
	>;
}

export function useBlockState<TContent>({
	value,
	getDefaultContent,
	onChange,
}: UseBlockStateOptions<TContent>): UseBlockStateResult<TContent> {
	const [clientId] = useState(() => value.id || nanoid());

	const resolveContent = () =>
		((value.content as TContent) ?? getDefaultContent());

	const [content, setContent] = useState<TContent>(resolveContent);
	const [styles, setStyles] = useState<React.CSSProperties | undefined>(
		() => value.styles,
	);
	const [settings, setSettings] = useState<Record<string, any> | undefined>(
		() => value.settings,
	);

	const prevValueIdRef = useRef<string | null>(null);
	const latestValueRef = useRef<BlockConfig>({
		...value,
		id: clientId,
		content,
		styles,
		settings,
	});

	// Store onChange in a ref to avoid infinite loops when parent re-renders
	const onChangeRef = useRef(onChange);
	useEffect(() => {
		onChangeRef.current = onChange;
	});

	// Track initial mount to avoid emitting onChange before any user interaction
	const isInitialMount = useRef(true);

	// Keep the latest value for structural metadata (parentId, order, etc.)
	useEffect(() => {
		latestValueRef.current = { ...value, id: clientId, content, styles, settings };
	}, [value, clientId, content, styles, settings]);

	// Re-initialize local state only when a different block instance mounts
	useEffect(() => {
		if (prevValueIdRef.current === null || prevValueIdRef.current !== value.id) {
			prevValueIdRef.current = value.id;
			setContent(resolveContent());
			setStyles(value.styles);
			setSettings(value.settings);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value.id]);

	// Emit changes upstream whenever local state mutates
	useEffect(() => {
		// Skip emitting on initial mount - only emit on actual user changes
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}

		const base = latestValueRef.current;
		const nextBlock: BlockConfig = {
			...base,
			id: clientId,
			content: content as BlockConfig["content"],
			styles,
			settings,
		};
		latestValueRef.current = nextBlock;
		onChangeRef.current(nextBlock);
	}, [clientId, content, styles, settings]);

	// Register accessors so sidebar settings can interact with the block state
	useEffect(() => {
		registerBlockState(clientId, {
			getContent: () => content,
			getStyles: () => styles,
			getSettings: () => settings,
			setContent,
			setStyles,
			setSettings,
			getFullState: () => latestValueRef.current,
		});
		return () => unregisterBlockState(clientId);
	}, [clientId, content, styles, settings]);

	return {
		clientId,
		content,
		setContent,
		styles,
		setStyles,
		settings,
		setSettings,
	};
}


