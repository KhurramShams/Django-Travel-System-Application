/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.output = {
        ...config.output,
        chunkLoadTimeout: 60000,
      };
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: '/settings',
        destination: '/',
        permanent: false,
      },
      {
        source: '/admin/settings',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
