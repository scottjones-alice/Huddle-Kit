import { existsSync } from "node:fs";
import path from "node:path";

import type { NextConfig } from "next";

// Next only reads .env from this app's folder; the repo keeps one root .env.
const rootEnvPath = path.resolve(import.meta.dirname, "../../.env");
if (existsSync(rootEnvPath)) {
  process.loadEnvFile(rootEnvPath);
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: false,
  // End-to-end tests build into their own folder so they never fight a running `pnpm dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  partialPrefetching: true,
  reactCompiler: true,
  transpilePackages: [
    "@alice/user-interface",
    "@alice/authentication",
    "@alice/environment",
  ],
  turbopack: {
    rules: {
      "*.css": {
        as: "*.css",
        // Preserve CSS Module exports instead of treating them as global CSS.
        condition: { not: { path: "*.module.css" } },
        loaders: ["@tailwindcss/turbopack"],
      },
    },
  },
};

export default nextConfig;
