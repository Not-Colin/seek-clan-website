// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is the correct configuration for this file.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ieciglsbyflhbixlbxmw.supabase.co', // Your Supabase hostname
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;