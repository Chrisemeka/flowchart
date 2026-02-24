import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Fix 1: Moved from 'experimental' to root level in Next.js 16
  serverExternalPackages: ['pdfjs-dist', 'pdf-parse'],

  // Fix 2: Keep the Webpack config for the build process (and for dev if we force it)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;