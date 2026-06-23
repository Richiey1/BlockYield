import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding", "pino");
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: false,
  trailingSlash: true,
};

export default nextConfig;
