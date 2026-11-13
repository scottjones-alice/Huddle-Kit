/**
 * Where the end-to-end stack runs. It uses its own ports and its own database,
 * so it can run next to `pnpm dev` without touching dev data.
 */

const DEFAULT_E2E_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/huddlekit_e2e";

export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? DEFAULT_E2E_DATABASE_URL;

export const PLATFORM_URL = "http://localhost:8100";
export const API_URL = "http://localhost:9100";

export const SMTP_HOST = "127.0.0.1";
export const SMTP_PORT = 1025;
export const MAILPIT_URL = "http://127.0.0.1:8025";

/** A password that passes the shared rules (at least 12 characters). */
export const TEST_PASSWORD = "correct-horse-battery-1";
