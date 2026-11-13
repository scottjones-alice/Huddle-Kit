import { serverOptions } from "@alice/environment/server";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Environment key declarations for @alice/payments.
 *
 * The AUTH_STRIPE_ prefix marks Stripe billing for clubs paying Huddlekit
 * (subscriptions, see club-billing.ts). Money clubs collect from their own
 * members is a different Stripe account setup (Connect) and must use its own
 * STRIPE_CONNECT_ keys, never these.
 */
export const keys = () =>
  createEnv({
    ...serverOptions,
    server: {
      // Annual price (price_...) on the same Stripe product as the monthly one.
      AUTH_STRIPE_CLUB_ANNUAL_PRICE_ID: z.string().min(1),
      // Stripe price for the club subscription (price_...).
      AUTH_STRIPE_CLUB_PRICE_ID: z.string().min(1),
      AUTH_STRIPE_SECRET_KEY: z.string().min(1),
      AUTH_STRIPE_WEBHOOK_SECRET: z.string().min(1),
    },
  });
