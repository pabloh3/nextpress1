import { promises as fs } from 'node:fs';

/**
 * Updates Caddyfile with new domain and attempts to reload Caddy.
 * Falls back gracefully if Caddy API is unavailable (config applies on restart).
 * 
 * Handles both domains (e.g. domain.com -> gets Auto-HTTPS) 
 * and IP addresses (e.g. 1.2.3.4 -> gets HTTP-only binding).
 */
export async function updateCaddyConfig(domain: string): Promise<{ success: boolean; message: string }> {
  const caddyfilePath = '/etc/caddy/Caddyfile';

  // Normalize domain (remove protocol if present)
  const cleanDomain = domain.replace(/^https?:\/\//, '');

  // Check if it's an IPv4 address to prevent Caddy from trying to provision SSL for an IP
  const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(cleanDomain);
  const caddyHost = isIpAddress ? `http://${cleanDomain}` : cleanDomain;

  const caddyConfig = `{
  admin 0.0.0.0:2019
}

${caddyHost} {
  reverse_proxy app:5000
}
`;

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
      return { success: true, message: 'Caddy configuration saved, will apply on restart' };
    } catch {
      // Fallback: Caddy will pick up changes on container restart
      return { success: true, message: 'Caddy configuration saved, will apply on restart' };
    }
  } catch (err) {
    // In non-Docker environments, skip Caddyfile updates
    console.log('Caddyfile update skipped (not in Docker environment or no write access)');
    return { success: true, message: 'Skipped Caddy update (non-Docker environment)' };
  }
}
