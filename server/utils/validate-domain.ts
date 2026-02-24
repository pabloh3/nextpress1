import dns from 'node:dns/promises';

const IPV4_REGEX = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
const LOCALHOST_REGEX = /^(localhost|.*\.localhost)$/;

/**
 * Checks if a domain requires DNS validation.
 * Skips validation for localhost variants and plain IPv4 addresses
 * since these are used during initial self-hosting setup before DNS is configured.
 */
function shouldSkipValidation(domain: string): boolean {
  return IPV4_REGEX.test(domain) || LOCALHOST_REGEX.test(domain);
}

/**
 * Strips protocol prefix from a domain/URL string.
 * Handles both http:// and https:// prefixes.
 */
function stripProtocol(input: string): string {
  return input.replace(/^https?:\/\//, '');
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
  const domain = stripProtocol(domainOrUrl);

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
