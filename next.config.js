/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  swcMinify: false,
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },
};

module.exports = nextConfig;
