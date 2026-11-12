/**
 * Mobile preset: settings every Expo env shares.
 *
 * It has no runtimeEnv on purpose. Expo only inlines variables written out
 * in full as `process.env.EXPO_PUBLIC_NAME`, so each mobile keys file lists
 * its own variables in runtimeEnv, one line per variable.
 */

import { throwValidationError } from "./validation-error";

export const mobileOptions = {
  clientPrefix: "EXPO_PUBLIC_",
  emptyStringAsUndefined: true,
  onValidationError: throwValidationError,
} as const;
