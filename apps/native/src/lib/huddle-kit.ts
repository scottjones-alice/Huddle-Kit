import HuddlekitAPI from "@alicesystems-co/huddlekit";

import { authClient } from "./auth-client";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (apiUrl === undefined || apiUrl === "") {
  throw new Error("EXPO_PUBLIC_API_URL is not set");
}

/**
 * The SDK insists on a session cookie being set before it sends a request.
 * This placeholder satisfies that check; `fetchWithSession` swaps it for the
 * real cookie that Better Auth keeps in secure storage.
 */
const COOKIE_PLACEHOLDER = "stored-by-better-auth";

const fetchWithSession: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);
  const cookie = await authClient.getCookie();

  if (cookie === "") {
    headers.delete("Cookie");
  } else {
    headers.set("Cookie", cookie);
  }

  // React Native would otherwise attach its own cookie jar on top of ours.
  return await fetch(input, { ...init, credentials: "omit", headers });
};

/** The one Huddlekit API client for the native app. Sign in through `authClient` first. */
export const huddlekit = new HuddlekitAPI({
  baseURL: apiUrl,
  fetch: fetchWithSession,
  sessionCookie: COOKIE_PLACEHOLDER,
});
