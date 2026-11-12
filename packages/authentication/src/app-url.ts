/**
 * Works out which app (platform web, native, ...) a request came from, so emails
 * link the user back to the place they started. Only trusted origins are
 * accepted; anything else falls back, so a forged Origin can't steer an email link.
 */

const originOf = (value: string): string | null => {
  try {
    const url = new URL(value);
    // Custom schemes (huddlekit://) have an opaque origin, so rebuild it.
    return url.origin === "null" ? `${url.protocol}//${url.host}` : url.origin;
  } catch {
    return null;
  }
};

export const resolveAppURL = (
  request: Request | undefined,
  trustedOrigins: string[],
  fallback: string
): string => {
  if (request === undefined) {
    return fallback;
  }
  const callback = new URL(request.url).searchParams.get("callbackURL");
  const candidates = [callback, request.headers.get("origin")];

  for (const candidate of candidates) {
    if (candidate === null) {
      continue;
    }
    // A scheme-only entry (huddlekit://) trusts every deep link under that scheme.
    const scheme = trustedOrigins.find(
      (trusted) => trusted.endsWith("://") && candidate.startsWith(trusted)
    );
    if (scheme !== undefined) {
      return scheme;
    }
    const origin = originOf(candidate);
    if (origin !== null && trustedOrigins.includes(origin)) {
      return origin;
    }
  }
  return fallback;
};
