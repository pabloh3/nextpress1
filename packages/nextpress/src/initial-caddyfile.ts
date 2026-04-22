/** First-boot Caddyfile before the app writes hostname-specific config (matches legacy installer). */
export const INITIAL_CADDYFILE = `{
  admin 0.0.0.0:2019
  email info@nextpress.com
}

# Default HTTP catch-all on port 80
:80 {
  reverse_proxy app:5000
}
`;
