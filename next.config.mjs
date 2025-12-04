import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // <- add this
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  },
})(nextConfig)

export default config