import { serverOptions } from "@alice/environment/server";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/** Environment key declarations for @alice/notifications. */
export const keys = () =>
  createEnv({
    ...serverOptions,
    server: {
      // Set for the EU region or a self-hosted Novu, e.g. https://eu.api.novu.co.
      NOVU_API_URL: z.url().optional(),
      NOVU_SECRET_KEY: z.string().min(1),
    },
  });
