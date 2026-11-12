/**
 * Validated environment variables for the background worker.
 *
 * Values come from the single root `.env` file (see `.env.example`). Import
 * `keys()` where you need them, so a missing or malformed variable fails fast
 * with a readable error instead of a mystery 401 from Trigger.dev later.
 */

import { serverBase, serverOptions } from "@alice/environment/server";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const keys = () =>
  createEnv({
    ...serverOptions,
    extends: [serverBase()],
    server: {
      // Only needed when self-hosting Trigger.dev; defaults to Trigger.dev Cloud.
      TRIGGER_API_URL: z.url().optional(),
      // Secret key for the environment you are running in:
      // `tr_dev_…` locally, `tr_stg_…` for staging, `tr_prod_…` for production.
      TRIGGER_SECRET_KEY: z.string().regex(/^tr_(?:dev|stg|prod)_/u, {
        message: "must start with tr_dev_, tr_stg_ or tr_prod_",
      }),
    },
  });
