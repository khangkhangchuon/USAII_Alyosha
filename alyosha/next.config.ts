import type { NextConfig } from "next";
import path from "node:path";

// Pin the workspace root to this app folder ONLY for local builds. Without this,
// Next infers the root from the nearest lockfile and picks up a stray
// ~/pnpm-lock.yaml, emitting a workspace-root warning. On Vercel, setting these
// breaks build-output path resolution (missing routes-manifest → ENOENT), and the
// stray lockfile doesn't exist there — so we skip them when VERCEL is set.
const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = isVercel
  ? {}
  : {
      turbopack: { root: path.resolve(__dirname) },
      outputFileTracingRoot: path.resolve(__dirname),
    };

export default nextConfig;
