/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required env vars
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },

  // Allow larger file uploads for OCR documents
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
