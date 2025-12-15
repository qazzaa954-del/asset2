/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Optimasi untuk Vercel
  output: 'standalone',
  // Enable compression
  compress: true,
  // Optimize production builds
  swcMinify: true,
}

module.exports = nextConfig

