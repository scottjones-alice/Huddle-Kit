/**
 * Better Auth client for the web apps. Import from "@alice/authentication/client".
 * Native apps use "@alice/authentication/client/native" so Expo dependencies
 * never enter the browser bundle. Types are inferred from the plugins, so
 * `authClient.signIn.email`, `organization.*` and `subscription.*` are checked.
 */

import { passkeyClient } from "@better-auth/passkey/client";
import { stripeClient } from "@better-auth/stripe/client";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export interface WebAuthClientOptions {
  /** Public URL of the backend API, e.g. http://localhost:9000. */
  baseURL: string;
}

/**
 * For the website and the platform. Cookies are set by the API, so requests
 * include credentials (the API's CORS settings already allow this).
 */
export const createWebAuthClient = ({ baseURL }: WebAuthClientOptions) =>
  createAuthClient({
    baseURL,
    fetchOptions: { credentials: "include" },
    plugins: [
      organizationClient(),
      passkeyClient(),
      stripeClient({ subscription: true }),
    ],
  });

export type WebAuthClient = ReturnType<typeof createWebAuthClient>;

export { PASSWORD_LIMITS } from "./password-rules";
