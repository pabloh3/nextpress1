import { useCallback, useEffect, useRef, useState } from "react";

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

export type UseDomainVerifyResult = {
	state: DomainVerifyState;
	/** Run GET /api/setup/verify-domain for the given string (call on blur). */
	verify: (query: string) => void;
	/** Clear state and abort any in-flight request (call when the input value changes). */
	reset: () => void;
};

/**
 * Domain readiness checks for the domain input UI. Runs only when `verify` is called (blur),
 * not while the user types.
 */
export function useDomainVerify(): UseDomainVerifyResult {
	const [state, setState] = useState<DomainVerifyState>({ kind: "idle" });
	const abortRef = useRef<AbortController | undefined>(undefined);

	const reset = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = undefined;
		setState({ kind: "idle" });
	}, []);

	const verify = useCallback((query: string) => {
		const trimmed = query.trim();
		abortRef.current?.abort();
		abortRef.current = undefined;

		if (!trimmed) {
			setState({ kind: "idle" });
			return;
		}

		const ac = new AbortController();
		abortRef.current = ac;
		setState({ kind: "verifying" });

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
	}, []);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
		};
	}, []);

	return { state, verify, reset };
}

export function hasBlockingDomainIssues(data: DomainReadinessData): boolean {
	const dnsBad = Object.values(data.dns).some((r) => !r.ok && !r.skipped);
	const ipBad = !data.ipMatch.skipped && !data.ipMatch.ok;
	const caddyBad = !data.caddy.skipped && !data.caddy.ok;
	return dnsBad || ipBad || caddyBad;
}
