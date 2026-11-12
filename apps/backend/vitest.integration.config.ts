import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Integration tests: real Postgres (TEST_DATABASE_URL), the real routes and
 * handlers, with only sign-in faked. See tests/integration/setup.ts.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("src", import.meta.url)) },
  },
  test: {
    env: {
      AUTH_STRIPE_CLUB_PRICE_ID: "price_test",
      AUTH_STRIPE_SECRET_KEY: "sk_test_123",
      AUTH_STRIPE_WEBHOOK_SECRET: "whsec_test",
      CRON_SECRET: "test-cron-secret-test-cron-secret-1234",
      FROM_EMAIL: "test@example.com",
      LOG_LEVEL: "silent",
      NOVU_SECRET_KEY: "novu_test",
      ONBOARDING_DRAFT_KEY: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
      RESEND_API_KEY: "re_test",
      SAFEGUARDING_KEY: "ZmVkY2JhOTg3NjU0MzIxMGZlZGNiYTk4NzY1NDMyMTA=",
    },
    fileParallelism: false,
    globalSetup: ["tests/integration/global-setup.ts"],
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["tests/integration/setup.ts"],
  },
});
