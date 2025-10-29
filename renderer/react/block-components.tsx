import * as React from "react";
import type { BlockData } from "./block-types";
import Counter from "./counter";

const Heading: React.FC<BlockData> = (props) => {
	const { content, level, className } = props as Extract<
		BlockData,
		{ blockName: "core/heading" }
	>;
	const Tag = `h${level}` as keyof JSX.IntrinsicElements;
	return <Tag className={className}>{content}</Tag>;
};

const CounterBlock: React.FC<BlockData> = (props) => {
	const { initialCount } = props as Extract<
		BlockData,
		{ blockName: "core/counter" }
	>;
	return <Counter initialCount={initialCount} />;
};

export const BLOCK_COMPONENTS: Record<string, React.FC<BlockData>> = {
	"core/heading": Heading,
	"core/counter": CounterBlock,
};
