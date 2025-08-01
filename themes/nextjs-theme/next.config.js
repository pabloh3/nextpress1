/** @type {import('next').NextConfig} */
const nextConfig = {
  // This theme runs on port 3001 for development
  // The main NextPress server will proxy requests to it
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