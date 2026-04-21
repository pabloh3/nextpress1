import dns from 'node:dns/promises';

const IPV4_REGEX = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
const LOCALHOST_REGEX = /^(localhost|.*\.localhost)$/;

/**
 * Checks if a domain requires DNS validation.
 * Skips validation for localhost variants and plain IPv4 addresses
 * since these are used during initial self-hosting setup before DNS is configured.
 */
function shouldSkipValidation(domain: string): boolean {
  const host = stripPort(domain);
  return IPV4_REGEX.test(host) || LOCALHOST_REGEX.test(host);
}

/**
 * Strips protocol prefix and port from a domain/URL string.
 * Handles both http:// and https:// prefixes and port numbers.
 */
function stripProtocol(input: string): string {
  return input.replace(/^https?:\/\//, '');
}

/**
 * Extracts hostname without port from a domain string.
 * E.g., "localhost:5000" -> "localhost"
 */
function stripPort(domain: string): string {
  return domain.replace(/:\d+$/, '');
}

/**
 * Normalized hostname for DNS / Caddy (no scheme, no port).
 */
export function normalizeSiteHostname(domainOrUrl: string): string {
  return stripPort(stripProtocol(domainOrUrl.trim()));
}

/**
 * True when host is a plain IPv4 address (no TLS from Caddy ACME for this site shape).
 */
export function isIpv4Host(host: string): boolean {
  return IPV4_REGEX.test(stripPort(host));
}

/**
 * Hostnames that will be listed on the Caddy site line (apex + www for public DNS names).
 * Localhost and IPv4 return a single host only.
 */
export function getCaddyTlsHostnames(domainOrUrl: string): string[] {
  const host = normalizeSiteHostname(domainOrUrl);
  if (!host) return [];
  if (shouldSkipValidation(host)) return [host];
  if (host.startsWith('www.')) {
    const apex = host.slice(4);
    return apex ? [host, apex] : [host];
  }
  return [host, `www.${host}`];
}

/**
 * True when public DNS / ACME checks are skipped (localhost variants or plain IPv4).
 */
export function shouldSkipPublicDnsCheck(domainOrUrl: string): boolean {
  const host = normalizeSiteHostname(domainOrUrl);
  if (!host) return false;
  return shouldSkipValidation(host);
}

/**
 * Validates that a domain has DNS A records configured.
 * 
 * Returns a result object indicating whether the domain resolves.
 * Skips validation entirely for localhost and IP addresses since
 * self-hosting users often configure via IP before DNS is ready.
 * 
 * @param domainOrUrl - Domain name or full URL to validate
 * @returns Validation result with status and message
 */
export async function validateDomain(domainOrUrl: string): Promise<{ valid: boolean; message: string }> {
  const domain = normalizeSiteHostname(domainOrUrl);

  if (!domain) {
    return { valid: false, message: 'Domain is required' };
  }

  if (shouldSkipValidation(domain)) {
    return { valid: true, message: 'Skipped DNS check (localhost or IP address)' };
  }

  try {
    const addresses = await dns.resolve4(domain);

    if (addresses.length > 0) {
      return { valid: true, message: `Domain resolves to ${addresses[0]}` };
    }

    return { valid: false, message: `Domain "${domain}" has no A records. Point your DNS A record to this server first.` };
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;

    // ENOTFOUND = domain doesn't exist, ENODATA = no A records
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      return {
        valid: false,
        message: `Domain "${domain}" does not resolve. Please point your DNS A record to this server before configuring.`,
      };
    }

    // ETIMEOUT, ESERVFAIL etc. - DNS infrastructure issue, not the user's fault
    return {
      valid: false,
      message: `Could not verify domain "${domain}" (DNS lookup failed: ${code}). Check your DNS configuration and try again.`,
    };
  }
}
