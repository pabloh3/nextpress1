import dns from "node:dns/promises";
import { getCaddyInternalBaseUrl, getOptionalPublicIpv4 } from "../config";
import {
	getCaddyTlsHostnames,
	normalizeSiteHostname,
	shouldSkipPublicDnsCheck,
} from "./validate-domain";

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

/**
 * Resolves IPv4 A records for one hostname (skipped for localhost / raw IP).
 */
async function resolveHostA(hostname: string): Promise<DnsHostResult> {
	if (shouldSkipPublicDnsCheck(hostname)) {
		return {
			ok: true,
			addresses: [],
			skipped: true,
			message: "Skipped (localhost or IP)",
		};
	}
	try {
		const addresses = await dns.resolve4(hostname);
		if (addresses.length === 0) {
			return {
				ok: false,
				addresses: [],
				message: "No A records",
			};
		}
		return { ok: true, addresses };
	} catch (err: unknown) {
		const code = (err as NodeJS.ErrnoException).code;
		return {
			ok: false,
			addresses: [],
			message:
				code === "ENOTFOUND" || code === "ENODATA"
					? "Domain does not resolve (no A record yet)"
					: `DNS error: ${code ?? "unknown"}`,
		};
	}
}

/**
 * From the app container, request /api/health through Caddy with a Host header
 * to confirm the edge proxy routes this hostname to the app.
 */
async function probeCaddyRoutesHost(hostname: string): Promise<{
	ok: boolean;
	skipped?: boolean;
	message: string;
}> {
	if (shouldSkipPublicDnsCheck(hostname)) {
		return {
			ok: true,
			skipped: true,
			message: "Skipped for localhost / IP",
		};
	}

	const base = getCaddyInternalBaseUrl();
	const url = `${base}/api/health`;

	try {
		const res = await fetch(url, {
			method: "GET",
			headers: { Host: hostname },
			signal: AbortSignal.timeout(8000),
		});

		if (!res.ok) {
			return {
				ok: false,
				message: `Caddy or upstream returned HTTP ${res.status} (Host: ${hostname})`,
			};
		}

		const body = (await res.json().catch(() => null)) as {
			status?: string;
		} | null;
		if (body?.status === "ok") {
			return {
				ok: true,
				message: "Caddy routes this host to the app (health check OK)",
			};
		}

		return {
			ok: false,
			message: "Health endpoint responded but body was unexpected",
		};
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return {
			ok: true,
			skipped: true,
			message: `Could not probe Caddy (${msg}). Outside Docker this is normal until the edge proxy is reachable as ${base}.`,
		};
	}
}

function evaluateIpMatch(
	hostnames: string[],
	dns: Record<string, DnsHostResult>,
	expectedIp: string | null,
): DomainReadinessData["ipMatch"] {
	if (!expectedIp) {
		return {
			ok: true,
			skipped: true,
			expectedIp: null,
			message:
				"Set PUBLIC_IPV4 (or SERVER_PUBLIC_IP) on the server to verify DNS points at this machine.",
		};
	}

	const publicHosts = hostnames.filter((h) => !shouldSkipPublicDnsCheck(h));
	if (publicHosts.length === 0) {
		return {
			ok: true,
			skipped: true,
			expectedIp,
			message: "IP match skipped for localhost / IP-only hostnames.",
		};
	}

	for (const h of publicHosts) {
		const row = dns[h];
		if (!row?.ok || row.skipped) {
			return {
				ok: false,
				skipped: false,
				expectedIp,
				message: `Cannot verify IP match until DNS resolves for ${h}.`,
			};
		}
		if (!row.addresses.includes(expectedIp)) {
			return {
				ok: false,
				skipped: false,
				expectedIp,
				message: `Expected A record ${expectedIp} for ${h}, got: ${row.addresses.join(", ")}`,
			};
		}
	}

	return {
		ok: true,
		skipped: false,
		expectedIp,
		message: `All checked hostnames resolve to this server (${expectedIp}).`,
	};
}

/**
 * Runs DNS, optional IP match, and optional Caddy routing probe for the domain UI.
 */
export async function verifyDomainReadiness(
	domainOrUrl: string,
): Promise<
	{ status: true; data: DomainReadinessData } | { status: false; message: string }
> {
	const normalizedInput = normalizeSiteHostname(domainOrUrl);
	if (!normalizedInput) {
		return { status: false, message: "Enter a domain or full site URL" };
	}

	const checkedHostnames = getCaddyTlsHostnames(domainOrUrl);
	const dns: Record<string, DnsHostResult> = {};

	for (const h of checkedHostnames) {
		dns[h] = await resolveHostA(h);
	}

	const expectedIp = getOptionalPublicIpv4() ?? null;
	const ipMatch = evaluateIpMatch(checkedHostnames, dns, expectedIp);

	const primaryForCaddy =
		checkedHostnames.find((h) => !shouldSkipPublicDnsCheck(h)) ??
		checkedHostnames[0] ??
		normalizedInput;
	const caddy = await probeCaddyRoutesHost(primaryForCaddy);

	return {
		status: true,
		data: {
			normalizedInput,
			checkedHostnames,
			dns,
			ipMatch,
			caddy,
		},
	};
}
