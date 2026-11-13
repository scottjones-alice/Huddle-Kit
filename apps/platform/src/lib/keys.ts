import { webOptions } from "@alice/environment/web";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/** Validated environment variables for this app. Import `keys()` where needed. */
export const keys = () =>
  createEnv({
    ...webOptions,
    client: {
      NEXT_PUBLIC_API_URL: z.url(),
      // Shortest time the home loader stays up, in milliseconds. End-to-end tests set 0.
      NEXT_PUBLIC_SPLASH_MIN_MS: z.coerce.number().int().min(0).default(6500),
    },
    // Next only inlines variables written out in full, one line per variable.
    runtimeEnv: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_SPLASH_MIN_MS: process.env.NEXT_PUBLIC_SPLASH_MIN_MS,
    },
  });
