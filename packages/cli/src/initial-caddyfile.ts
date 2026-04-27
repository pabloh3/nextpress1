/** First-boot Caddyfile before the app writes hostname-specific config (matches legacy installer). */
export const INITIAL_CADDYFILE = `{
  admin 0.0.0.0:2019
  email info@nextpress.com
}

# First-boot catch-all. Docker publishes this through http://nextpress.localhost:5000.
:80 {
  reverse_proxy app:5000
}
`;
