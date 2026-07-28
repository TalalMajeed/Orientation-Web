import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // R3F WebGL canvases don't survive StrictMode's dev-only double-mount
  // (mount → unmount → remount drops the GL context on first load).
  reactStrictMode: false,
};

export default nextConfig;
