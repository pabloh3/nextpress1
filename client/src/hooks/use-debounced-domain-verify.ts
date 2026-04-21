import { useEffect, useRef, useState } from "react";

export type DnsHostResult = {
	ok: boolean;
	addresses: string[];
	skipped?: boolean;
	message?: string;
};

export type DomainReadinessData = {
	normalizedInput: string;
	checkedHostnames: string[];
	dns: Record<string, DnsHostResult>;
	ipMatch: {
		ok: boolean;
		skipped: boolean;
		expectedIp: string | null;
		message: string;
	};
	caddy: {
		ok: boolean;
		skipped?: boolean;
		message: string;
	};
};

export type DomainVerifyState =
	| { kind: "idle" }
	| { kind: "verifying" }
	| { kind: "error"; message: string }
	| { kind: "ready"; data: DomainReadinessData };

/**
 * Debounced GET /api/setup/verify-domain for the domain input UI.
 * useEffect lives here (not in presentational components) per project hook rules.
 */
export function useDebouncedDomainVerify(
	value: string,
	debounceMs = 550,
): DomainVerifyState {
	const [state, setState] = useState<DomainVerifyState>({ kind: "idle" });
	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const abortRef = useRef<AbortController | undefined>(undefined);

	useEffect(() => {
		const trimmed = value.trim();
		if (!trimmed) {
			setState({ kind: "idle" });
			return;
		}

		setState({ kind: "verifying" });
		clearTimeout(timerRef.current);
		abortRef.current?.abort();

		timerRef.current = setTimeout(() => {
			const ac = new AbortController();
			abortRef.current = ac;

			void (async () => {
				try {
					const res = await fetch(
						`/api/setup/verify-domain?q=${encodeURIComponent(trimmed)}`,
						{ signal: ac.signal, credentials: "include" },
					);
					const json = (await res.json()) as {
						status?: boolean;
						data?: DomainReadinessData;
						message?: string;
					};

					if (!res.ok || json.status === false) {
						setState({
							kind: "error",
							message: json.message || "Verification failed",
						});
						return;
					}

					if (!json.data) {
						setState({
							kind: "error",
							message: "Invalid verification response",
						});
						return;
					}

					setState({ kind: "ready", data: json.data });
				} catch (e: unknown) {
					if (e instanceof DOMException && e.name === "AbortError") {
						return;
					}
					setState({
						kind: "error",
						message: e instanceof Error ? e.message : "Verification failed",
					});
				}
			})();
		}, debounceMs);

		return () => {
			clearTimeout(timerRef.current);
			abortRef.current?.abort();
		};
	}, [value, debounceMs]);

	return state;
}

export function hasBlockingDomainIssues(data: DomainReadinessData): boolean {
	const dnsBad = Object.values(data.dns).some((r) => !r.ok && !r.skipped);
	const ipBad = !data.ipMatch.skipped && !data.ipMatch.ok;
	const caddyBad = !data.caddy.skipped && !data.caddy.ok;
	return dnsBad || ipBad || caddyBad;
}
