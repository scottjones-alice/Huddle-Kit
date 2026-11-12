import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("src", import.meta.url)) },
  },
  test: {
    env: {
      AUTH_STRIPE_CLUB_PRICE_ID: "price_test",
      AUTH_STRIPE_SECRET_KEY: "sk_test_123",
      AUTH_STRIPE_WEBHOOK_SECRET: "whsec_test",
      FROM_EMAIL: "test@example.com",
      LOG_LEVEL: "silent",
      NOVU_SECRET_KEY: "novu_test",
      ONBOARDING_DRAFT_KEY: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
      RESEND_API_KEY: "re_test",
    },
  },
});
