/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // This theme will be served by the main NextPress server
  // so we don't need to run it on a separate port
  async rewrites() {
    return [
      {
        source: '/api/nextpress/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
  // Disable static optimization for dynamic CMS content
  output: 'standalone',
  // Enable server-side rendering for all pages
  trailingSlash: true,
}

module.exports = nextConfig 