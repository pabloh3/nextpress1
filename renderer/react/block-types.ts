interface HeadingConfig {
	blockName: "core/heading";
	content: string;
	level: 1 | 2 | 3 | 4 | 5 | 6;
	className?: string;
	interactive?: boolean;
}

interface CounterConfig {
	blockName: "core/counter";
	initialCount: number;
	interactive?: boolean;
}

export type BlockData = HeadingConfig | CounterConfig;
