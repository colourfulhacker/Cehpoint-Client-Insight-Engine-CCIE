import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["xlsx"],
  webpack: (config) => {
    config.externals.push("xlsx");
    return config;
  },
};

export default nextConfig;
