import type { NextConfig } from "next";
import path from "node:path";

// Pin the workspace root to this app folder. Without this, Next infers the root
// from the nearest lockfile and picks up a stray ~/pnpm-lock.yaml, emitting a
// workspace-root warning and mis-resolving file tracing.
const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(__dirname) },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
