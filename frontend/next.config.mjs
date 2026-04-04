/** @type {import('next').NextConfig} */
const nextConfig = {
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
