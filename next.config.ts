import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // R3F WebGL canvases don't survive StrictMode's dev-only double-mount
  // (mount → unmount → remount drops the GL context on first load).
  reactStrictMode: false,

  // Testing on a phone over the LAN/hotspot hits the dev server by IP, not
  // localhost. Next blocks /_next/* dev resources from unlisted origins, which
  // kills the HMR client and leaves every page unhydrated — server HTML renders
  // fine, but nothing is interactive. Private ranges only; never used in prod.
  // The ngrok hostname is also allowed for tunnel-based testing.
  allowedDevOrigins: [
    "10.*.*.*",
    "172.*.*.*",
    "192.168.*.*",
    "pavilion-unblended-canopy.ngrok-free.dev",
  ],
};

export default nextConfig;
