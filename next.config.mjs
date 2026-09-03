/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  headers: async () => [
    {
      source: '/manifest.webmanifest',
      headers: [{ key: 'Content-Type', value: 'application/manifest+json' }],
    },
  ],
};

export default nextConfig;
