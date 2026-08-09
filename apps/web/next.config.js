/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@motion/shared': '../../packages/shared/src',
      '@motion/schemas': '../../packages/schemas/src',
      '@motion/database': '../../packages/database/src',
      '@motion/agents': '../../packages/agents/src',
      '@motion/media': '../../packages/media/src',
      '@motion/storage': '../../packages/storage/src',
      '@motion/render': '../../packages/render/src',
    };
    return config;
  },
};

module.exports = nextConfig;
