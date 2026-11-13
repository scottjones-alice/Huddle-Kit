import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic gate on the session cookie. It only checks the cookie is there, so
 * it is a redirect for convenience, not security: every API call still checks
 * the session on the server. The cookie name comes from the "huddlekit" prefix
 * in @alice/authentication; HTTPS adds a __Secure- prefix.
 */
const SESSION_COOKIES = [
  "huddlekit.session_token",
  "__Secure-huddlekit.session_token",
] as const;

/** Pages for people who are not signed in. A signed-in person is sent home. */
const GUEST_ONLY_PATHS = ["/login", "/signup", "/forgot-password", "/passkey"];

/** Pages anyone can open, signed in or not. */
const OPEN_PATHS = [
  "/reset-password",
  "/check-email",
  "/verify-email",
  "/link-expired",
  "/account-locked",
  "/signed-out",
  "/accept-invite",
  "/loading-preview",
];

const matches = (pathname: string, paths: readonly string[]): boolean =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = SESSION_COOKIES.some((name) => request.cookies.has(name));

  // Better Auth sends a failed verification link back to the callback with
  // ?error=..., and the callback is usually the home page.
  if (pathname === "/" && request.nextUrl.searchParams.has("error")) {
    return NextResponse.redirect(
      new URL("/link-expired?type=verify", request.url)
    );
  }

  if (matches(pathname, OPEN_PATHS)) {
    return NextResponse.next();
  }

  if (matches(pathname, GUEST_ONLY_PATHS)) {
    return signedIn
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  // The home page decides where a signed-in person goes next, and shows the
  // loader meanwhile, so it handles the signed-out case itself.
  if (pathname === "/" || signedIn) {
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|huddlekit|images|videos|maplibre|favicon.ico).*)",
  ],
};
