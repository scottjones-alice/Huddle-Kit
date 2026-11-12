/**
 * Server preset: settings every server-side env shares.
 *
 * This is the only server code that points at process.env.
 * Packages and apps spread serverOptions into their own createEnv call.
 */

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { throwValidationError } from "./validation-error";

export const serverOptions = {
  emptyStringAsUndefined: true,
  onValidationError: throwValidationError,
  runtimeEnv: process.env,
} as const;

/**
 * Variables every server app has. Add it to an app's `extends`.
 *
 * @returns The validated env containing `NODE_ENV`.
 */
export const serverBase = () =>
  createEnv({
    ...serverOptions,
    server: {
      NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    },
  });
