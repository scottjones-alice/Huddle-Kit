import { serverOptions } from "@alice/environment/server";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Environment keys for Stripe Connect: money clubs collect from their own
 * members. Kept apart from `keys.ts` so the AUTH_STRIPE_ billing keys and these
 * never mix.
 *
 * Both are optional so an app that has not set Connect up still starts; the
 * Connect routes answer 503 until they are present.
 */
export const connectKeys = () =>
  createEnv({
    ...serverOptions,
    server: {
      // Restricted key (rk_...) of the platform account, scoped to Connect.
      STRIPE_CONNECT_SECRET_KEY: z.string().min(1).optional(),
      STRIPE_CONNECT_WEBHOOK_SECRET: z.string().min(1).optional(),
    },
  });
