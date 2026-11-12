/**
 * Web preset: settings every Next.js env shares.
 *
 * It has no runtimeEnv on purpose. Next only inlines variables written out
 * in full as `process.env.NEXT_PUBLIC_NAME`, so each web keys file lists its
 * own variables in runtimeEnv, one line per variable.
 * Only variables starting with NEXT_PUBLIC_ are exposed to the browser.
 */

import { throwValidationError } from "./validation-error";

export const webOptions = {
  clientPrefix: "NEXT_PUBLIC_",
  emptyStringAsUndefined: true,
  onValidationError: throwValidationError,
} as const;
