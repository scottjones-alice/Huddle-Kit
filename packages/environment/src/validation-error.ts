/**
 * Shared validation-error handler for all three presets.
 *
 * Why this exists: t3-env's default handler prints the problems to the
 * console but throws a generic "Invalid environment variables" error. The
 * conventions say a bad env must stop the app with an error *naming* the
 * variable, so this handler puts every problem into the thrown message.
 *
 * Internal file: it is used by server.ts, web.ts and mobile.ts and is
 * deliberately not listed in package.json `exports`.
 */

import type { StandardSchemaV1 } from "@t3-oss/env-core";

/**
 * Turns an issue's path (for example ["DATABASE_URL"]) into a readable name.
 *
 * @param issue - The validation issue whose path names the variable.
 * @returns The variable name, or a placeholder when the path is empty.
 */
const variableName = (issue: StandardSchemaV1.Issue): string => {
  const segment = issue.path?.[0];

  if (segment === undefined) {
    return "(unknown variable)";
  }

  // A path segment is either a plain key or an object wrapping one.
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- Standard Schema defines this union as a property key or a key wrapper; discriminate that validated contract.
  const key = typeof segment === "object" ? segment.key : segment;

  return String(key);
};

/**
 * Throws one error listing every invalid variable, for example:
 *
 *   Invalid environment variables:
 *   - DATABASE_URL: Invalid input
 *
 * A plain Error is used on purpose: foundation packages can't import
 * `@alice/errors`, and a bad env is a startup failure, not an API error.
 *
 * @param issues - Every validation issue found in the environment.
 * @throws {Error} Always, listing each invalid variable.
 */
export const throwValidationError = (
  issues: readonly StandardSchemaV1.Issue[]
): never => {
  const lines = issues.map(
    (issue) => `- ${variableName(issue)}: ${issue.message}`
  );

  throw new Error(["Invalid environment variables:", ...lines].join("\n"));
};
