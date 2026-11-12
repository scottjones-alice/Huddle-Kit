import { createNativeAuthClient } from "@alice/authentication/client/native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (apiUrl === undefined || apiUrl === "") {
  throw new Error("EXPO_PUBLIC_API_URL is not set");
}

// app.json "scheme" can be a string or a list; the first one is the main scheme.
const configured = Constants.expoConfig?.scheme;
const scheme = Array.isArray(configured) ? configured[0] : configured;

if (scheme === undefined) {
  throw new Error('app.json needs a "scheme" for authentication links');
}

/** The one auth client for the native app. The session is kept in secure storage. */
export const authClient = createNativeAuthClient({
  baseURL: apiUrl,
  scheme,
  storage: SecureStore,
});

export type Session = typeof authClient.$Infer.Session;
