/**
 * Parses widths that are only a number + % (e.g. `33.33%`, `50 %`).
 * Returns the numeric percent, or null for `calc()`, `min()`, mixed units, etc.
 */
export function parsePlainPercentWidth(value: string): number | null {
	const t = value.trim();
	const m = /^(\d+(?:\.\d+)?)\s*%$/.exec(t);
	if (!m) return null;
	return Number.parseFloat(m[1] || "0");
}

export type FlexColumnGapContext = {
	/** Same CSS value as the columns container `gap` (e.g. `20px`, `1rem`). */
	gap: string;
	/** Number of columns in the row (used to subtract `(n - 1) * gap` from 100%). */
	columnCount: number;
};

/**
 * Width for a plain percentage so row total + gaps fits: `p%` of (100% − (n−1)×gap).
 */
function gapAdjustedPercentWidth(
	percent: number,
	gapCss: string,
	columnCount: number,
): string {
	const slots = Math.max(0, columnCount - 1);
	const ratio = percent / 100;
	if (slots === 0 || columnCount <= 1) {
		return `${percent}%`;
	}
	const g = gapCss.trim() || "0px";
	return `calc((100% - ${slots} * (${g})) * ${ratio})`;
}

/**
 * Maps a column width string to flex-item CSS for `core/columns` in row flex layout.
 * Supports `auto`, flex fractions like `1fr` / `1.5 fr`, and any fixed width (`%`, `px`, `rem`, `calc()`, …).
 * Plain `%` values use gap-aware `calc()` when `gapContext` is passed so totals do not exceed the row.
 */
export function buildFlexRowColumnStyle(
	width: string | undefined,
	minColumnWidth: string | undefined,
	gapContext?: FlexColumnGapContext,
): Record<string, string> {
	const min = minColumnWidth?.trim() || "220px";
	const raw = (width ?? "auto").trim();
	const w = raw.length === 0 ? "auto" : raw;

	if (w.toLowerCase() === "auto") {
		return { flex: "1 1 0%", minWidth: min };
	}

	const compact = w.replace(/\s+/g, "");
	const frMatch = /^(\d+(?:\.\d+)?)fr$/i.exec(compact);
	if (frMatch) {
		const flexGrow = Number.parseFloat(frMatch[1] || "1") || 1;
		return { flex: `${flexGrow} 1 0%`, minWidth: min };
	}

	const plainPct = parsePlainPercentWidth(w);
	if (
		plainPct !== null &&
		gapContext &&
		gapContext.columnCount > 1
	) {
		const gapCss = gapContext.gap?.trim() || "0px";
		const resolvedWidth = gapAdjustedPercentWidth(
			plainPct,
			gapCss,
			gapContext.columnCount,
		);
		return { flex: "1 1 auto", width: resolvedWidth, minWidth: min };
	}

	return { flex: "1 1 auto", width: w, minWidth: min };
}
