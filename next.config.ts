import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled for r3f compatibility — see BUILD_GUIDE.md §11.
  reactStrictMode: false,
  transpilePackages: ["three"],
};

export default nextConfig;
