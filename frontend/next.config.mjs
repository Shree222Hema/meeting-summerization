/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Correct top-level key for Next.js 16
    root: './'
  },
  // Opt out from webpack processing these native node packages
  serverExternalPackages: [
    '@xenova/transformers', 
    'fluent-ffmpeg', 
    'youtube-transcript', 
    'pdf-parse', 
    'mammoth'
  ]
};

export default nextConfig;
