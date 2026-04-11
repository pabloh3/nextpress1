/**
 * Maps a column width string to flex-item CSS for `core/columns` in row flex layout.
 * Supports `auto`, flex fractions like `1fr` / `1.5 fr`, and any fixed width (`%`, `px`, `rem`, `calc()`, …).
 */
export function buildFlexRowColumnStyle(
	width: string | undefined,
	minColumnWidth: string | undefined,
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

	return { flex: "1 1 auto", width: w, minWidth: min };
}
