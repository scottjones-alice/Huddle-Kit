import { expoClient } from "@better-auth/expo/client";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { WebAuthClientOptions } from "./client";

/** Where the native app keeps the session; pass `import * as SecureStore from "expo-secure-store"`. */
export type NativeSecureStorage = Parameters<typeof expoClient>[0]["storage"];

export interface NativeAuthClientOptions extends WebAuthClientOptions {
  /** URL scheme from app.json, e.g. "huddlekit". Matches AUTH_NATIVE_SCHEME on the API. */
  scheme: string;
  storage: NativeSecureStorage;
}

/**
 * For the native app. The session lives in secure storage instead of browser
 * cookies. Passkeys and billing are not offered here yet.
 */
export const createNativeAuthClient = ({
  baseURL,
  scheme,
  storage,
}: NativeAuthClientOptions) =>
  createAuthClient({
    baseURL,
    plugins: [organizationClient(), expoClient({ scheme, storage })],
  });

export type NativeAuthClient = ReturnType<typeof createNativeAuthClient>;
