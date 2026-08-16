import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    "10.*.*.*",
    "172.*.*.*",
    "192.168.*.*",
    "pavilion-unblended-canopy.ngrok-free.dev",
  ],
};

export default nextConfig;
