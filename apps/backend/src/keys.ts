import { serverOptions } from "@alice/environment/server";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const DEFAULT_BACKEND_PORT = 9000;
const DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://localhost:8000";
const DEFAULT_MAX_BODY_BYTES = 1_048_576;
const DEFAULT_RATE_LIMIT_MAX = 300;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;
const DEFAULT_SLOW_REQUEST_MS = 1000;
const MAX_PORT = 65_535;

/** A whole number of at least one, read from a string env value. */
const positiveInt = (fallback: number) =>
  z.coerce.number().int().min(1).default(fallback);

/** Environment key declarations for @huddlekit/backend. */
export const keys = () =>
  createEnv({
    ...serverOptions,
    server: {
      BACKEND_PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_PORT)
        .default(DEFAULT_BACKEND_PORT),
      // Comma-separated list of browser origins allowed to call the API.
      CORS_ORIGINS: z
        .string()
        .default(DEFAULT_CORS_ORIGINS)
        .transform((value) =>
          value
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
        )
        .pipe(z.array(z.url()).min(1)),
      // Shared secret the worker sends to run scheduled jobs. At least 32 characters.
      CRON_SECRET: z.string().min(32),
      FROM_EMAIL: z.email(),
      LOG_LEVEL: z
        .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
        .default("info"),
      MAX_BODY_BYTES: positiveInt(DEFAULT_MAX_BODY_BYTES),
      NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
      // 32 random bytes, base64 (openssl rand -base64 32). Encrypts saved onboarding drafts.
      ONBOARDING_DRAFT_KEY: z
        .string()
        .refine((value) => Buffer.from(value, "base64").length === 32, {
          message: "Must be 32 bytes, base64 encoded",
        }),
      RATE_LIMIT_MAX: positiveInt(DEFAULT_RATE_LIMIT_MAX),
      RATE_LIMIT_WINDOW_SECONDS: positiveInt(DEFAULT_RATE_LIMIT_WINDOW_SECONDS),
      REQUEST_TIMEOUT_MS: positiveInt(DEFAULT_REQUEST_TIMEOUT_MS),
      RESEND_API_KEY: z.string().min(1),
      // 32 random bytes, base64. Encrypts safeguarding concern details and notes.
      SAFEGUARDING_KEY: z
        .string()
        .refine((value) => Buffer.from(value, "base64").length === 32, {
          message: "Must be 32 bytes, base64 encoded",
        }),
      SHUTDOWN_TIMEOUT_MS: positiveInt(DEFAULT_SHUTDOWN_TIMEOUT_MS),
      SLOW_REQUEST_MS: positiveInt(DEFAULT_SLOW_REQUEST_MS),
      // Only true behind a proxy you control: it makes X-Forwarded-For trusted.
      TRUST_PROXY: z.stringbool().default(false),
    },
  });
