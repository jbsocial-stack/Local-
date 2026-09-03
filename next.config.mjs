/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/manifest.webmanifest',
      headers: [{ key: 'Content-Type', value: 'application/manifest+json' }],
    },
  ],
};

export default nextConfig;
