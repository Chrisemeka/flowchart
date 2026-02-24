/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Tell Next.js not to bundle pdf-parse OR its underlying pdfjs-dist engine
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],

  experimental: {
    // 2. Force Vercel to physically copy all pdfjs-dist files (including the missing worker) 
    // into the serverless function for your API routes.
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/pdfjs-dist/**/*'],
    },
  },
};

export default nextConfig;