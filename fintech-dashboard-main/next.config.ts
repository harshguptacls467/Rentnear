import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals as string[]), "pg-native"];
    return config;
  },
};

export default nextConfig;