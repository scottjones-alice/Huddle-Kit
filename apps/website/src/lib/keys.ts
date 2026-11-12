import { webOptions } from "@alice/environment/web";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/** Validated environment variables for this app. Import `keys()` where needed. */
export const keys = () =>
  createEnv({
    ...webOptions,
    client: {
      NEXT_PUBLIC_API_URL: z.url(),
      NEXT_PUBLIC_PLATFORM_URL: z.url(),
    },
    // Next only inlines variables written out in full, one line per variable.
    runtimeEnv: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_PLATFORM_URL: process.env.NEXT_PUBLIC_PLATFORM_URL,
    },
  });
