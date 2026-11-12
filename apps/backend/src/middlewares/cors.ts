import { cors as honoCors } from "hono/cors";

import { keys } from "@/keys";

const PREFLIGHT_MAX_AGE_SECONDS = 600;

export function cors() {
  const { CORS_ORIGINS } = keys();

  return honoCors({
    allowHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // Auth sessions are cookies, so the browser must be allowed to send them.
    credentials: true,
    exposeHeaders: ["X-Request-Id"],
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
    origin: CORS_ORIGINS,
  });
}
