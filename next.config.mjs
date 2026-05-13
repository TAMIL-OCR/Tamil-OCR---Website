/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required env vars
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },

  // Cloudflare Pages compatibility
  output: 'standalone',

  // Optimize for edge deployment
  images: {
    unoptimized: true,
  },

  // Disable server-side features that Cloudflare doesn't support
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
