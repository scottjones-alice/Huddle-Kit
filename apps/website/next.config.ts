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
        loaders: ["@tailwindcss/turbopack"],
      },
    },
  },
};

export default nextConfig;
