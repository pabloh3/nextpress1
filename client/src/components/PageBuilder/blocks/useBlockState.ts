import { useCallback, useEffect, useState } from "react";
import type React from "react";
import type { BlockConfig } from "@shared/schema-types";
import { nanoid } from "nanoid";
import {
	registerBlockState,
	unregisterBlockState,
} from "./blockStateRegistry";

function useMountEffect(effect: () => void | (() => void)) {
	useEffect(effect, []);
}

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

	const content = ((value.content as TContent) ?? getDefaultContent());
	const styles = value.styles;
	const settings = value.settings;

	const setContent = useCallback(
		(update: TContent | ((prev: TContent) => TContent)) => {
			const next =
				typeof update === "function"
					? (update as (prev: TContent) => TContent)(content)
					: update;
			onChange({ ...value, content: next as BlockConfig["content"] });
		},
		[value, onChange, content],
	);

	const setStyles = useCallback(
		(
			update:
				| React.CSSProperties
				| undefined
				| ((prev: React.CSSProperties | undefined) => React.CSSProperties | undefined),
		) => {
			const next =
				typeof update === "function"
					? (update as (prev: React.CSSProperties | undefined) => React.CSSProperties | undefined)(
							styles,
					  )
					: update;
			onChange({ ...value, styles: next });
		},
		[value, onChange, styles],
	);

	const setSettings = useCallback(
		(
			update:
				| Record<string, any>
				| undefined
				| ((
						prev: Record<string, any> | undefined,
				  ) => Record<string, any> | undefined),
		) => {
			const next =
				typeof update === "function"
					? (update as (
							prev: Record<string, any> | undefined,
					  ) => Record<string, any> | undefined)(settings)
					: update;
			onChange({ ...value, settings: next });
		},
		[value, onChange, settings],
	);

	useMountEffect(() => {
		registerBlockState(clientId, {
			getContent: () => content,
			getStyles: () => styles,
			getSettings: () => settings,
			setContent,
			setStyles,
			setSettings,
			getFullState: () => value,
		});
		return () => unregisterBlockState(clientId);
	});

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
