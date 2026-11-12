import { serverOptions } from "@alice/environment/server";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const DEFAULT_PRESIGN_TTL_SECONDS = 900;
const MAX_PRESIGN_TTL_SECONDS = 604_800;

/** Environment key declarations for @alice/storage. */
export const keys = () =>
  createEnv({
    ...serverOptions,
    server: {
      AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
      AWS_REGION: z.string().min(1),
      AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
      S3_BUCKET: z.string().min(3),
      S3_ENDPOINT: z.url().optional(),
      S3_FORCE_PATH_STYLE: z.stringbool().default(false),
      S3_PRESIGN_TTL_SECONDS: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_PRESIGN_TTL_SECONDS)
        .default(DEFAULT_PRESIGN_TTL_SECONDS),
    },
  });
