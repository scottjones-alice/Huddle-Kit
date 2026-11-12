import HuddlekitAPI from "@alicesystems-co/huddlekit";

import { keys } from "./keys";

/**
 * The SDK insists on a session cookie being set before it sends a request, but
 * the real one is HttpOnly and the browser refuses to let scripts set a Cookie
 * header. This placeholder satisfies the SDK's check; the browser drops it and
 * sends the real Better Auth cookie itself because of `credentials: "include"`.
 */
const BROWSER_COOKIE_PLACEHOLDER = "browser-managed";

/** The one Huddlekit API client for this app. Sign in through `authClient` first. */
export const huddlekit = new HuddlekitAPI({
  baseURL: keys().NEXT_PUBLIC_API_URL,
  fetchOptions: { credentials: "include" },
  sessionCookie: BROWSER_COOKIE_PLACEHOLDER,
});
