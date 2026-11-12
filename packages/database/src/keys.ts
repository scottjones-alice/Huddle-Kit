import { serverOptions } from "@alice/environment/server";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const MAX_POOL = 200;

/** Environment key declarations for @alice/database. */
export const keys = () =>
  createEnv({
    ...serverOptions,
    server: {
      DATABASE_LOGGER: z.stringbool().default(false),
      DATABASE_POOL_MAX: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_POOL)
        .default(10),
      DATABASE_STATEMENT_TIMEOUT_MS: z.coerce
        .number()
        .int()
        .min(1)
        .default(15_000),
      DATABASE_URL: z.url(),
    },
  });
