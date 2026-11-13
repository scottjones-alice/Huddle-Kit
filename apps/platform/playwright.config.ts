import { defineConfig, devices } from "@playwright/test";

import {
  API_URL,
  E2E_DATABASE_URL,
  MAILPIT_URL,
  PLATFORM_URL,
  SMTP_HOST,
  SMTP_PORT,
} from "./e2e/env";

const isCI = process.env.CI !== undefined;
const allBrowsers = process.env.E2E_ALL_BROWSERS !== undefined;

/**
 * Everything the backend needs, written out here on purpose. Nothing is read
 * from the root .env, so a test run can never reach real Resend, Novu, Stripe
 * or your dev database. These are throwaway values.
 */
const backendEnv = {
  AUTH_COOKIE_DOMAIN: "",
  AUTH_RATE_LIMIT_ENABLED: "false",
  AUTH_STRIPE_CLUB_PRICE_ID: "price_e2e",
  AUTH_STRIPE_SECRET_KEY: "sk_test_e2e",
  AUTH_STRIPE_WEBHOOK_SECRET: "whsec_e2e",
  AWS_REGION: "eu-west-2",
  BACKEND_PORT: new URL(API_URL).port,
  BETTER_AUTH_SECRET: "e2e-better-auth-secret-e2e-better-auth-secret",
  BETTER_AUTH_URL: API_URL,
  CORS_ORIGINS: PLATFORM_URL,
  CRON_SECRET: "e2e-cron-secret-e2e-cron-secret-1234",
  DATABASE_URL: E2E_DATABASE_URL,
  FROM_EMAIL: "noreply@e2e.huddlekit.test",
  LOG_LEVEL: "warn",
  NODE_ENV: "test",
  NOVU_SECRET_KEY: "novu_e2e",
  ONBOARDING_DRAFT_KEY: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
  PLATFORM_URL,
  RESEND_API_KEY: "re_e2e_unused",
  S3_BUCKET: "e2e-bucket-unused",
  SAFEGUARDING_KEY: "ZmVkY2JhOTg3NjU0MzIxMGZlZGNiYTk4NzY1NDMyMTA=",
  SMTP_URL: `smtp://${SMTP_HOST}:${SMTP_PORT}`,
};

const platformEnv = {
  NEXT_DIST_DIR: ".next-e2e",
  NEXT_PUBLIC_API_URL: API_URL,
  // Skip the home loader's minimum wait so tests don't sit on the splash screen.
  NEXT_PUBLIC_SPLASH_MIN_MS: "0",
};

const platformPort = new URL(PLATFORM_URL).port;

export default defineConfig({
  expect: { timeout: 10_000 },
  forbidOnly: isCI,
  fullyParallel: true,
  globalSetup: "./e2e/setup/global.setup.ts",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ...(allBrowsers
      ? [
          { name: "firefox", use: { ...devices["Desktop Firefox"] } },
          { name: "webkit", use: { ...devices["Desktop Safari"] } },
        ]
      : []),
  ],
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  retries: isCI ? 1 : 0,
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 45_000,
  use: {
    baseURL: PLATFORM_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      // A catch-all inbox. Uses the installed binary locally; CI starts its own service.
      command: `mailpit --smtp ${SMTP_HOST}:${SMTP_PORT} --listen 127.0.0.1:8025`,
      reuseExistingServer: true,
      timeout: 30_000,
      url: `${MAILPIT_URL}/api/v1/info`,
    },
    {
      command: "pnpm --filter @huddlekit/backend exec tsx src/index.ts",
      cwd: "../..",
      env: backendEnv,
      reuseExistingServer: !isCI,
      timeout: 60_000,
      url: `${API_URL}/api/auth/ok`,
    },
    {
      // CI builds once and serves the build. Locally the dev server is quicker to start.
      command: isCI
        ? `pnpm build && pnpm exec next start --port ${platformPort}`
        : `pnpm exec next dev --port ${platformPort}`,
      env: platformEnv,
      reuseExistingServer: !isCI,
      timeout: 240_000,
      url: `${PLATFORM_URL}/login`,
    },
  ],
  // Password hashing and the dev server compile on demand, so too many workers slow every test down.
  workers: isCI ? 2 : 4,
});
