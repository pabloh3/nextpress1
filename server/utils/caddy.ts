import { promises as fs } from 'node:fs';
import {
  getCaddyTlsHostnames,
  isIpv4Host,
  normalizeSiteHostname,
} from './validate-domain';

/**
 * Caddyfile-safe ACME contact line (no braces / newlines).
 */
function sanitizeAcmeEmail(raw: string): string | null {
  const t = raw.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t.replace(/[\r\n{}]/g, '');
}

/**
 * Builds the on-disk Caddyfile body: global admin (+ optional email), then site block
 * with apex + www for public hostnames (matches common production Caddy patterns).
 */
export function buildCaddyfileContent(
  domainOrUrl: string,
  options?: { acmeEmail?: string | null },
): string {
  const hosts = getCaddyTlsHostnames(domainOrUrl);
  const primary = hosts[0] ?? normalizeSiteHostname(domainOrUrl);
  const siteAddresses = isIpv4Host(primary)
    ? `http://${primary}`
    : hosts.join(', ');

  const acme = options?.acmeEmail ? sanitizeAcmeEmail(options.acmeEmail) : null;
  const emailLine = acme ? `  email ${acme}\n` : '';

  return `{
  admin 0.0.0.0:2019
${emailLine}}

${siteAddresses} {
  reverse_proxy app:5000
}
`;
}

/**
 * Updates Caddyfile with new domain and attempts to reload Caddy.
 * Falls back gracefully if Caddy API is unavailable (config applies on restart).
 *
 * Handles both domains (e.g. domain.com -> Auto-HTTPS for apex + www)
 * and IP addresses (e.g. 1.2.3.4 -> HTTP-only binding).
 */
export async function updateCaddyConfig(
  domain: string,
  options?: { acmeEmail?: string | null },
): Promise<{ success: boolean; message: string }> {
  const caddyfilePath = '/etc/caddy/Caddyfile';
  const caddyConfig = buildCaddyfileContent(domain, options);

  try {
    await fs.writeFile(caddyfilePath, caddyConfig);

    // Try to reload Caddy via Admin API
    try {
      const response = await fetch('http://caddy:2019/load', {
        method: 'POST',
        headers: { 'Content-Type': 'text/caddyfile' },
        body: caddyConfig,
      });

      if (response.ok) {
        return { success: true, message: 'Caddy configuration updated and reloaded' };
      }

      const errorBody = await response.text().catch(() => 'unknown error');
      return { success: false, message: `Caddy reload failed (${response.status}): ${errorBody}` };
    } catch {
      // Admin /load often fails (wrong adapter, network); file on shared volume is the source of truth when Caddy runs with --watch
      return {
        success: true,
        message: 'Caddy configuration saved (reload via admin API skipped; Caddy picks up file changes when run with --watch)',
      };
    }
  } catch {
    // In non-Docker environments, skip Caddyfile updates
    console.log('Caddyfile update skipped (not in Docker environment or no write access)');
    return { success: true, message: 'Skipped Caddy update (non-Docker environment)' };
  }
}
